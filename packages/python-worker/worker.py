import os
import time
import logging
import base64
import json
from dataclasses import dataclass
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import tempfile
import re
from datetime import date, datetime
import hashlib

import cv2
import numpy as np
import easyocr

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def _decode_jwt_claims(token: str | None) -> dict:
    if not token or token.count(".") != 2:
        return {}

    try:
        payload = token.split(".")[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding)
        claims = json.loads(decoded.decode("utf-8"))
        return claims if isinstance(claims, dict) else {}
    except Exception:
        return {}


def _describe_supabase_key(token: str | None) -> tuple[str, str | None]:
    if not token:
        return "missing", None

    if token.startswith("sb_"):
        return "secret", None

    claims = _decode_jwt_claims(token)
    role = claims.get("role") if claims else None
    if role:
        return "jwt", str(role)

    return "unknown", None

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
    exit(1)

SUPABASE_KEY_FORMAT, SUPABASE_KEY_ROLE = _describe_supabase_key(SUPABASE_SERVICE_ROLE_KEY)
if SUPABASE_KEY_ROLE and SUPABASE_KEY_ROLE != "service_role":
    logger.warning(
        "SUPABASE_SERVICE_ROLE_KEY decoded role=%s; billing and payout admin RPCs require service_role.",
        SUPABASE_KEY_ROLE,
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


@dataclass
class RpcResult:
    data: object


def _rpc(function_name: str, params: dict | None = None):
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{function_name}",
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        },
        json=params or {},
        timeout=30,
    )

    if not response.ok:
        try:
            error_payload = response.json()
        except ValueError:
            error_payload = response.text
        raise RuntimeError(error_payload)

    if not response.content:
        return RpcResult(data=None)

    try:
        return RpcResult(data=response.json())
    except ValueError:
        return RpcResult(data=response.text)

# Initialize EasyOCR reader (loads models into memory once)
# English-only: CNIC front has all fields printed in English
logger.info("Initializing EasyOCR models...")
reader = easyocr.Reader(['en'], gpu=False)
logger.info("EasyOCR initialized.")

# Buckets: new uploads go to 'kyc', legacy uploads are in 'tour-operator-assets'
KYC_BUCKET    = "kyc"
LEGACY_BUCKET = os.getenv("KYC_BUCKET", "tour-operator-assets")
CNIC_HASH_PEPPER = os.getenv("KYC_CNIC_HASH_PEPPER", "")


def _preprocess_for_ocr(path: str) -> str:
    """
    Preprocess a CNIC photo to maximise EasyOCR accuracy.

    Steps:
      1. Grayscale — removes colour noise, halves data size
      2. Upscale to minimum 1800px wide — EasyOCR accuracy drops below ~1000px
      3. CLAHE contrast normalization — handles uneven flash / dark corners
      4. Gaussian denoise — removes JPEG block artefacts
      5. Write as high-quality JPEG to a new temp file

    This costs zero API calls and runs on CPU in <1 second.
    """
    img = cv2.imread(path)
    if img is None:
        return path  # fallback: use original if OpenCV can't read it

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Upscale: target minimum width 1800px for legible CNIC text
    h, w = gray.shape
    if w < 1800:
        scale = 1800 / w
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # CLAHE — locally adaptive contrast, works far better than global equalize
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Denoise (removes JPEG compression noise without blurring text strokes)
    denoised = cv2.fastNlMeansDenoising(enhanced, h=10, templateWindowSize=7, searchWindowSize=21)

    fd, out_path = tempfile.mkstemp(suffix="_proc.jpg")
    os.close(fd)
    cv2.imwrite(out_path, denoised, [cv2.IMWRITE_JPEG_QUALITY, 97])
    return out_path


def _infer_bucket(path: str) -> str:
    """Determine the storage bucket from the stored path.
    New paths: 'kyc/tour_operators/...'  → stored in 'kyc' bucket
    Legacy paths: 'verification/...' etc → stored in LEGACY_BUCKET
    """
    if path and path.startswith("kyc/"):
        return KYC_BUCKET
    return LEGACY_BUCKET


def _download_storage_path(path: str, suffix: str) -> str:
    """Download a private Storage object by path into a temp file.
    Auto-detects bucket from the path prefix.
    """
    bucket = _infer_bucket(path)
    encoded_path = requests.utils.requote_uri(path.lstrip('/'))
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{encoded_path}"
    resp = requests.get(
        url,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
        },
        timeout=30,
    )
    if not resp.ok:
        # Try the other bucket as fallback
        fallback = LEGACY_BUCKET if bucket == KYC_BUCKET else KYC_BUCKET
        url2 = f"{SUPABASE_URL}/storage/v1/object/{fallback}/{encoded_path}"
        resp2 = requests.get(
            url2,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
            },
            timeout=30,
        )
        if resp2.ok:
            resp = resp2
        else:
            resp.raise_for_status()

    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(resp.content)
    return tmp_path


def _normalize_cnic(raw: str) -> str | None:
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if len(digits) != 13:
        return None
    return f"{digits[0:5]}-{digits[5:12]}-{digits[12:13]}"


def _cnic_hash(normalized_cnic: str) -> str:
    value = (CNIC_HASH_PEPPER + normalized_cnic).encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def _extract_dates(text: str) -> list[date]:
    results: list[date] = []
    # DD.MM.YYYY  or  DD-MM-YYYY  or  DD/MM/YYYY
    for m in re.finditer(r"\b(\d{2})[.\-/](\d{2})[.\-/](\d{4})\b", text):
        dd, mm, yyyy = m.group(1), m.group(2), m.group(3)
        try:
            results.append(date(int(yyyy), int(mm), int(dd)))
        except ValueError:
            continue
    return results


def _pick_dob_and_expiry(dates: list[date]) -> tuple[date | None, date | None]:
    if not dates:
        return None, None
    today = date.today()
    past   = [d for d in dates if d <= today]
    future = [d for d in dates if d > today]
    dob = None
    if past:
        dob = min(past)
        if (today - dob).days < 365 * 12:   # less than 12 years ago → not a DOB
            dob = None
    expiry = max(future) if future else None
    return dob, expiry


def _clean_name(raw: str) -> str:
    """Remove noise from a name string: non-alpha except spaces, collapse spaces."""
    cleaned = re.sub(r"[^A-Za-z\s]", " ", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned.upper()


def _extract_cnic_fields(components: list[str], raw_text: str) -> dict:
    """
    Extract Pakistani CNIC fields from EasyOCR component list.

    CNIC front (English side) layout:
        Name:          MUHAMMAD ALI
        Father's Name: MUHAMMAD AKBAR
        Date of Birth: 01.01.1985
        Date of Expiry: 01.01.2030
        Gender:        M
        CNIC:          12345-6789012-3

    Strategy:
      1. Regex on the full concatenated text for labelled fields
      2. Component-index fallback: find label token, take next token as value
      3. Gender standalone: single M or F token
    """
    result: dict = {}

    # ── CNIC Number ───────────────────────────────────────────────────────────
    cnic_match = re.search(r"\b(\d{5})\s*[\-\u2013]?\s*(\d{7})\s*[\-\u2013]?\s*(\d)\b", raw_text)
    result["cnic_number"] = _normalize_cnic(cnic_match.group(0).replace(" ", "")) if cnic_match else None

    # ── Gender ────────────────────────────────────────────────────────────────
    gender_match = re.search(r"(?:gender|sex)\s*[:\-]?\s*([MFmf])\b", raw_text, re.IGNORECASE)
    if gender_match:
        result["gender"] = gender_match.group(1).upper()
    else:
        # Standalone M or F component (common — OCR picks it up as isolated char)
        for comp in components:
            stripped = comp.strip().rstrip(".")
            if stripped in ("M", "F", "m", "f") and len(stripped) == 1:
                result["gender"] = stripped.upper()
                break

    # ── Full Name ─────────────────────────────────────────────────────────────
    # Pattern A: "Name: SOME NAME" — same line only (no newline crossing)
    name_a = re.search(
        r"(?<![a-z])name\s*[:\-]?\s+([A-Za-z][A-Za-z ]{2,40})",
        raw_text, re.IGNORECASE,
    )
    # Pattern B: label on one component, value on next
    full_name_raw = None
    if name_a:
        candidate = name_a.group(1).strip()
        # Make sure it doesn't bleed into Father's Name line
        candidate = re.split(r"(?i)father|husband|date|birth|expiry|gender|cnic", candidate)[0]
        full_name_raw = candidate.strip()
    else:
        for i, comp in enumerate(components):
            if re.search(r"^name$", comp.strip(), re.IGNORECASE) and i + 1 < len(components):
                nxt = components[i + 1].strip()
                # Skip obvious location codes: short all-caps tokens like "UC", "USL"
                if len(nxt) > 2 and not re.search(r"father|husband|date|birth|cnic", nxt, re.IGNORECASE):
                    full_name_raw = nxt
                    # If next component looks like a name suffix/continuation, skip it
                    break

    if full_name_raw:
        result["full_name"] = _clean_name(full_name_raw)

    # ── Father's / Husband's Name ─────────────────────────────────────────────
    father_a = re.search(
        r"(?:father['\u2019s]*\s*name|husband['\u2019s]*\s*name)\s*[:\-]?\s*([A-Za-z][A-Za-z ]{2,40})",
        raw_text, re.IGNORECASE,
    )
    father_raw = None
    if father_a:
        candidate = father_a.group(1).strip()
        candidate = re.split(r"(?i)date|birth|expiry|gender|cnic|name", candidate)[0]
        father_raw = candidate.strip()
    else:
        for i, comp in enumerate(components):
            if re.search(r"father|husband", comp.strip(), re.IGNORECASE) and i + 1 < len(components):
                # Could be "Father's Name" as one piece, value is next component
                nxt = components[i + 1].strip()
                # Skip if the next component is itself a label
                if len(nxt) > 2 and not re.search(r"date|birth|expiry|gender|cnic", nxt, re.IGNORECASE):
                    father_raw = nxt
                    break
                # Or maybe "Father" and "s Name" split — look two ahead
                if i + 2 < len(components):
                    nxt2 = components[i + 2].strip()
                    if re.search(r"name", nxt, re.IGNORECASE) and len(nxt2) > 2:
                        father_raw = nxt2
                        break

    if father_raw:
        result["father_name"] = _clean_name(father_raw)

    # ── Address ───────────────────────────────────────────────────────────────
    address_match = re.search(
        r"(?:address|add|addr)\s*[:\-]?\s*(.{10,120})",
        raw_text, re.IGNORECASE,
    )
    if address_match:
        result["address"] = address_match.group(1).strip()

    return result


def _update_session(session_token: str, patch: dict):
    supabase.table("kyc_sessions").update(patch).eq("session_token", session_token).execute()

def process_session(session):
    session_token = session['session_token']
    user_id = session['user_id']
    logger.info(f"Processing session: {session_token} for user: {user_id}")

    id_front_path = session.get('id_front_path')
    id_back_path  = session.get('id_back_path')

    if not id_front_path or not id_back_path:
        logger.error(f"Missing required images for session {session_token}")
        _update_session(session_token, {
            "status": "failed",
            "failure_code": "missing_images",
            "failure_reason": "Missing CNIC front/back image.",
        })
        return

    front_path = None
    back_path  = None
    front_proc = None
    back_proc  = None

    try:
        logger.info(f"Downloading images for session {session_token}...")
        front_path = _download_storage_path(id_front_path, "_front.jpg")
        back_path  = _download_storage_path(id_back_path,  "_back.jpg")

        logger.info("Preprocessing images for OCR quality improvement...")
        front_proc = _preprocess_for_ocr(front_path)
        back_proc  = _preprocess_for_ocr(back_path)

        logger.info("Running EasyOCR (English + Urdu)...")
        # Use detail=0 for both sides, combine
        front_components = reader.readtext(front_proc, detail=0, paragraph=False)
        back_components  = reader.readtext(back_proc,  detail=0, paragraph=False)
        combined_components = [*front_components, *back_components]
        raw_text = "\n".join(combined_components)

        logger.info(f"OCR extracted {len(combined_components)} text segments:")
        for c in combined_components[:30]:   # log first 30 for debugging
            logger.info(f"  [{c}]")

        # ── Extract all structured fields ──────────────────────────────────────
        fields = _extract_cnic_fields(combined_components, raw_text)
        cnic_number = fields.get("cnic_number")

        # ── Dates ─────────────────────────────────────────────────────────────
        dates = _extract_dates(raw_text)
        dob, expiry = _pick_dob_and_expiry(dates)

        ocr_payload = {
            "engine": "easyocr",
            "front_components": front_components,
            "back_components": back_components,
            "raw_text": raw_text,
            "extracted": {
                "cnic_number":   cnic_number,
                "full_name":     fields.get("full_name"),
                "father_name":   fields.get("father_name"),
                "gender":        fields.get("gender"),
                "address":       fields.get("address"),
                "date_of_birth": dob.isoformat() if dob else None,
                "expiry_date":   expiry.isoformat() if expiry else None,
            },
        }

        # ── Validation: CNIC format ────────────────────────────────────────────
        if not cnic_number:
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "cnic_unreadable",
                "failure_reason": "Could not read a valid CNIC number. Please retake clearer photos.",
                "ocr_result": ocr_payload,
            })
            return

        # ── Validation: blocked CNIC ───────────────────────────────────────────
        blocked = supabase.table("kyc_blocked_cnics").select("cnic_number").eq("cnic_number", cnic_number).limit(1).execute().data
        if blocked:
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "cnic_blocked",
                "failure_reason": "This CNIC is blocked. Contact support.",
                "ocr_result": ocr_payload,
                "cnic_number": cnic_number,
            })
            return

        # ── Validation: blocked CNIC hash ─────────────────────────────────────
        cnic_hash = _cnic_hash(cnic_number)
        blocked_hash = (
            supabase.table("blocked_cnic_registry")
            .select("cnic_hash")
            .eq("cnic_hash", cnic_hash)
            .limit(1)
            .execute()
            .data
        )
        if blocked_hash:
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "cnic_blocked",
                "failure_reason": "This CNIC is blocked. Contact support.",
                "ocr_result": ocr_payload,
                "cnic_number": cnic_number,
            })
            return

        # ── Validation: expiry ────────────────────────────────────────────────
        if expiry and expiry < date.today():
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "id_expired",
                "failure_reason": "This CNIC appears expired.",
                "ocr_result": ocr_payload,
                "cnic_number":   cnic_number,
                "full_name":     fields.get("full_name"),
                "father_name":   fields.get("father_name"),
                "gender":        fields.get("gender"),
                "date_of_birth": dob.isoformat() if dob else None,
                "expiry_date":   expiry.isoformat() if expiry else None,
            })
            return

        # ── Validation: duplicate CNIC on another account ─────────────────────
        dup = (
            supabase.table("kyc_sessions")
            .select("id,user_id,status")
            .eq("cnic_number", cnic_number)
            .neq("user_id", user_id)
            .in_("status", ["pending_admin_review", "approved"])
            .limit(1)
            .execute()
            .data
        )
        if dup:
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "duplicate_cnic",
                "failure_reason": "This CNIC is already in use on another account.",
                "ocr_result": ocr_payload,
                "cnic_number":   cnic_number,
                "date_of_birth": dob.isoformat() if dob else None,
                "expiry_date":   expiry.isoformat() if expiry else None,
            })
            return

        # ── Success: write all extracted fields ───────────────────────────────
        logger.info(
            f"Session {session_token} OCR success — "
            f"cnic={cnic_number} name={fields.get('full_name')} "
            f"gender={fields.get('gender')} dob={dob}"
        )
        _update_session(session_token, {
            "status":        "pending_admin_review",
            "ocr_result":    ocr_payload,
            "cnic_number":   cnic_number,
            "full_name":     fields.get("full_name"),
            "father_name":   fields.get("father_name"),
            "gender":        fields.get("gender"),
            "address":       fields.get("address"),
            "date_of_birth": dob.isoformat() if dob else None,
            "expiry_date":   expiry.isoformat() if expiry else None,
            "failure_code":  None,
            "failure_reason": None,
        })
        logger.info(f"Session {session_token} marked pending_admin_review.")
        
    except Exception as e:
        logger.error(f"Error processing session {session_token}: {e}")
        # Mark as failed
        _update_session(session_token, {
            "status": "failed",
            "failure_code": "system_error",
            "failure_reason": f"System error during processing: {str(e)}",
        })
        
    finally:
        # Cleanup temp files (both originals and preprocessed copies)
        for p in (front_path, back_path, front_proc, back_proc):
            if p and os.path.exists(p):
                os.remove(p)

POLLING_INTERVAL = int(os.environ.get("POLLING_INTERVAL_SECONDS", "3"))
BILLING_AUTOMATION_ENABLED = os.environ.get("BILLING_AUTOMATION_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
BILLING_AUTOMATION_INTERVAL = max(int(os.environ.get("BILLING_AUTOMATION_INTERVAL_SECONDS", "86400")), 300)
PAYOUT_AUTOMATION_ENABLED = os.environ.get("PAYOUT_AUTOMATION_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
PAYOUT_AUTOMATION_INTERVAL = max(int(os.environ.get("PAYOUT_AUTOMATION_INTERVAL_SECONDS", "300")), 10)
PAYOUT_AUTOMATION_AUTO_SETTLE = os.environ.get("PAYOUT_AUTOMATION_AUTO_SETTLE", "false").lower() in {"1", "true", "yes", "on"}


def poll_kyc_sessions_once():
    response = supabase.table("kyc_sessions").select("*").eq("status", "processing").execute()
    sessions = response.data

    if sessions:
        logger.info(f"Found {len(sessions)} session(s) to process.")
        for session in sessions:
            process_session(session)


def run_billing_automation_once():
    if not BILLING_AUTOMATION_ENABLED:
        return

    as_of_date = date.today().isoformat()
    logger.info("Running billing automation cycle for %s...", as_of_date)
    billing_response = _rpc(
        "run_due_operator_billing_cycles",
        {
            "p_as_of_date": as_of_date,
            "p_operator_user_id": None,
        },
    )
    billing_rows = billing_response.data or []
    processed_count = len(billing_rows) if isinstance(billing_rows, list) else (1 if billing_rows else 0)

    logger.info(
        "Billing automation closed %s due billing cycle(s) for as_of_date=%s.",
        processed_count,
        as_of_date,
    )


def run_payout_automation_once():
    if not PAYOUT_AUTOMATION_ENABLED:
        return

    logger.info("Running payout automation cycle...")
    refresh_response = _rpc("refresh_all_operator_payout_eligibility")
    refreshed_profiles = refresh_response.data
    logger.info(f"Refreshed payout eligibility for {refreshed_profiles or 0} operator commercial profile(s).")

    batch_response = _rpc("create_operator_payout_batch", {
        "p_scheduled_for": datetime.utcnow().isoformat() + "Z"
    })
    batch_rows = batch_response.data or []
    batch = batch_rows[0] if isinstance(batch_rows, list) and batch_rows else batch_rows

    if not batch:
        logger.info("No eligible payout items were ready for batching.")
        return

    logger.info(
        "Created payout batch %s for %s item(s).",
        batch.get("batch_reference"),
        batch.get("items_scheduled"),
    )

    if not PAYOUT_AUTOMATION_AUTO_SETTLE:
        return

    paid_response = _rpc("mark_operator_payout_batch_paid", {
        "p_batch_id": batch.get("batch_id")
    })
    paid_rows = paid_response.data or []
    paid_batch = paid_rows[0] if isinstance(paid_rows, list) and paid_rows else paid_rows
    logger.info(
        "Auto-settled payout batch %s for %s paid item(s).",
        paid_batch.get("batch_reference") if paid_batch else batch.get("batch_reference"),
        paid_batch.get("items_paid") if paid_batch else 0,
    )

def main():
    logger.info("Starting background KYC verification worker...")
    logger.info("Worker RPC transport=rest-v1 service_role_headers=enabled")
    logger.info(
        "Supabase admin key env=SUPABASE_SERVICE_ROLE_KEY format=%s decoded_role=%s",
        SUPABASE_KEY_FORMAT,
        SUPABASE_KEY_ROLE or "unknown",
    )
    logger.info(
        "Billing automation enabled=%s interval=%ss",
        BILLING_AUTOMATION_ENABLED,
        BILLING_AUTOMATION_INTERVAL,
    )
    logger.info(
        "Payout automation enabled=%s interval=%ss auto_settle=%s",
        PAYOUT_AUTOMATION_ENABLED,
        PAYOUT_AUTOMATION_INTERVAL,
        PAYOUT_AUTOMATION_AUTO_SETTLE,
    )
    next_billing_run_at = 0.0
    next_payout_run_at = 0.0
    while True:
        try:
            poll_kyc_sessions_once()
        except Exception as e:
            logger.error(f"Error polling KYC sessions: {e}")

        try:
            if BILLING_AUTOMATION_ENABLED and time.monotonic() >= next_billing_run_at:
                run_billing_automation_once()
                next_billing_run_at = time.monotonic() + BILLING_AUTOMATION_INTERVAL
        except Exception as e:
            logger.error(f"Error running billing automation: {e}")
            next_billing_run_at = time.monotonic() + BILLING_AUTOMATION_INTERVAL

        try:
            if PAYOUT_AUTOMATION_ENABLED and time.monotonic() >= next_payout_run_at:
                run_payout_automation_once()
                next_payout_run_at = time.monotonic() + PAYOUT_AUTOMATION_INTERVAL
        except Exception as e:
            logger.error(f"Error running payout automation: {e}")
            next_payout_run_at = time.monotonic() + PAYOUT_AUTOMATION_INTERVAL

        # Wait before next poll
        logger.debug(f"Sleeping for {POLLING_INTERVAL} seconds...")
        time.sleep(POLLING_INTERVAL)

if __name__ == "__main__":
    main()

