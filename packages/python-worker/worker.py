import os
import time
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import tempfile
import re
from datetime import date, datetime

import easyocr

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize EasyOCR reader (loads models into memory once)
logger.info("Initializing EasyOCR models...")
reader = easyocr.Reader(['en'], gpu=False) # Fallback to CPU if GPU not available
logger.info("EasyOCR initialized.")

BUCKET = os.getenv("KYC_BUCKET", "tour-operator-assets")

def _download_storage_path(bucket: str, path: str, suffix: str) -> str:
    """Download a private Storage object (by path) into a temp file and return the local file path."""
    # Use direct Storage API with service role credentials.
    # https://supabase.com/docs/reference/restful-api/storage-download-file
    encoded_path = requests.utils.requote_uri(path.lstrip('/'))
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{encoded_path}"
    resp = requests.get(
        url,
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
        },
        timeout=30,
    )
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


def _extract_dates(text: str) -> list[date]:
    results: list[date] = []
    for m in re.finditer(r"\b(\d{2})[\-/](\d{2})[\-/](\d{4})\b", text):
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
    past = [d for d in dates if d <= today]
    future = [d for d in dates if d > today]

    # Heuristic: DOB is an older past date (typically decades ago)
    dob = None
    if past:
        dob = min(past)
        # If the earliest past date is too recent, it's probably not DOB.
        if (today - dob).days < 365 * 12:
            dob = None

    # Heuristic: expiry is a future date (or the latest date we saw)
    expiry = max(future) if future else None
    return dob, expiry


def _update_session(session_token: str, patch: dict):
    supabase.table("kyc_sessions").update(patch).eq("session_token", session_token).execute()

def process_session(session):
    session_token = session['session_token']
    user_id = session['user_id']
    logger.info(f"Processing session: {session_token} for user: {user_id}")
    
    id_front_path = session.get('id_front_path')
    id_back_path = session.get('id_back_path')

    if not id_front_path or not id_back_path:
        logger.error(f"Missing required images for session {session_token}")
        _update_session(session_token, {
            "status": "failed",
            "failure_code": "missing_images",
            "failure_reason": "Missing CNIC front/back image.",
        })
        return

    front_path = None
    back_path = None
    
    try:
        logger.info(f"Downloading images for session {session_token}...")
        front_path = _download_storage_path(BUCKET, id_front_path, "_front.jpg")
        back_path = _download_storage_path(BUCKET, id_back_path, "_back.jpg")

        logger.info("Running EasyOCR...")
        front_components = reader.readtext(front_path, detail=0)
        back_components = reader.readtext(back_path, detail=0)
        combined_components = [*front_components, *back_components]
        raw_text = " ".join(combined_components)
        logger.info(f"OCR extracted {len(combined_components)} components.")

        # Extract CNIC
        cnic_match = re.search(r"\b\d{5}[\-\s]?\d{7}[\-\s]?\d\b", raw_text)
        cnic_number = _normalize_cnic(cnic_match.group(0)) if cnic_match else None

        # Extract DOB/Expiry heuristically from all dates
        dates = _extract_dates(raw_text)
        dob, expiry = _pick_dob_and_expiry(dates)

        ocr_payload = {
            "engine": "easyocr",
            "front_components": front_components,
            "back_components": back_components,
            "raw_text": raw_text,
            "extracted": {
                "cnic_number": cnic_number,
                "date_of_birth": dob.isoformat() if dob else None,
                "expiry_date": expiry.isoformat() if expiry else None,
            },
        }

        # Validation: CNIC format
        if not cnic_number:
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "cnic_unreadable",
                "failure_reason": "Could not read a valid CNIC number. Please retake clearer photos.",
                "ocr_result": ocr_payload,
            })
            return

        # Validation: blocked CNIC
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

        # Validation: expiry
        if expiry and expiry < date.today():
            _update_session(session_token, {
                "status": "failed",
                "failure_code": "id_expired",
                "failure_reason": "This CNIC appears expired.",
                "ocr_result": ocr_payload,
                "cnic_number": cnic_number,
                "date_of_birth": dob.isoformat() if dob else None,
                "expiry_date": expiry.isoformat() if expiry else None,
            })
            return

        # Validation: duplicate CNIC (other user)
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
                "cnic_number": cnic_number,
                "date_of_birth": dob.isoformat() if dob else None,
                "expiry_date": expiry.isoformat() if expiry else None,
            })
            return

        # Update session to pending admin review
        logger.info(f"Finished processing session: {session_token}. Updating database...")
        _update_session(session_token, {
            "status": "pending_admin_review",
            "ocr_result": ocr_payload,
            "cnic_number": cnic_number,
            "date_of_birth": dob.isoformat() if dob else None,
            "expiry_date": expiry.isoformat() if expiry else None,
            "failure_code": None,
            "failure_reason": None,
        })

        logger.info(f"Session {session_token} successfully marked as pending_admin_review.")
        
    except Exception as e:
        logger.error(f"Error processing session {session_token}: {e}")
        # Mark as failed
        _update_session(session_token, {
            "status": "failed",
            "failure_code": "system_error",
            "failure_reason": f"System error during processing: {str(e)}",
        })
        
    finally:
        # Cleanup temp files
        if front_path and os.path.exists(front_path):
            os.remove(front_path)
        if back_path and os.path.exists(back_path):
            os.remove(back_path)

def main():
    logger.info("Starting background KYC verification worker...")
    while True:
        try:
            # Poll for processing sessions
            response = supabase.table("kyc_sessions").select("*").eq("status", "processing").execute()
            sessions = response.data
            
            if sessions:
                logger.info(f"Found {len(sessions)} session(s) to process.")
                for session in sessions:
                    process_session(session)
        except Exception as e:
            logger.error(f"Error polling database: {e}")
        
        # Wait before next poll
        time.sleep(3)

if __name__ == "__main__":
    main()
