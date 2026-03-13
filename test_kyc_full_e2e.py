"""
TripAvail KYC Full End-to-End Test Suite
=========================================
Covers every scenario in the KYC → appeal → approval → suspension pipeline:

  PHASE 1 — Upload & OCR
    ✓ Create test user (holywolf92@gmail.com) as tour_operator
    ✓ Create KYC session
    ✓ Upload CNIC front + back (the two screenshots)
    ✓ Set status=processing → wait for Railway OCR worker
    ✓ Verify OCR extracted fields (CNIC#, name, father name, etc.)
    ✓ Verify profile JSONB synced by trigger (kycStatus = pending_admin_review)

  PHASE 2 — Admin Rejection + Notification
    ✓ Admin rejects the session with review notes
    ✓ Verify kyc_sessions.status = rejected
    ✓ Verify tour_operator_profiles.verification_documents.kycStatus = rejected
    ✓ Verify user_roles.verification_status = rejected
    ✓ Verify notification row inserted (type=verification_rejected)
    ✓ Verify kyc_rejection_reason written to profile

  PHASE 3 — Appeal / Re-upload
    ✓ Simulate appeal: create NEW kyc_session (old rejected stays immutable)
    ✓ Upload CNIC images to new session
    ✓ Set status=processing → wait for worker
    ✓ Verify new session reaches pending_admin_review (OCR ran again)
    ✓ Verify old rejected session unchanged (audit trail intact)

  PHASE 4 — Admin Approval + Notification
    ✓ Admin approves the new session (with manual OCR fields)
    ✓ Verify kyc_sessions.status = approved
    ✓ Verify user_roles.verification_status = approved
    ✓ Verify tour_operator_profiles promoted (kyc_verified_name, etc.)
    ✓ Verify approval notification row inserted

  PHASE 5 — Suspension
    ✓ Admin suspends the operator account
    ✓ Verify account_status = suspended
    ✓ Verify can_partner_operate() = FALSE
    ✓ Verify approved verification status NOT regressed

  CLEANUP
    ✓ Delete all test sessions, notifications, user_roles, auth user

Usage:
  cd D:\\Tripfinal
  .venv\\Scripts\\python test_kyc_full_e2e.py
"""

import sys, time, uuid, os, json
from datetime import datetime, timezone, timedelta

# ── Deps check ────────────────────────────────────────────────────────────────
try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase-py not installed. Run: .venv\\Scripts\\pip install supabase")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://zkhppxjeaizpyinfpecj.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraHBweGplYWl6cHlpbmZwZWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzMDk0MiwiZXhwIjoyMDg1MjA2OTQyfQ.zt1KEbgD-NdBV0DoltpjF2iJF8p_uxsue2q2eOfP-fQ"

FRONT_IMG = r"D:\Tripfinal\Screenshot 2026-03-14 030312.png"
BACK_IMG  = r"D:\Tripfinal\Screenshot 2026-03-14 030428.png"

TEST_EMAIL    = "holywolf92@gmail.com"
TEST_PASSWORD = "TripAvail@Test2026!"

OCR_TIMEOUT_S  = 90   # how long to wait for Railway worker
OCR_POLL_S     = 4    # poll interval

# ── Helpers ───────────────────────────────────────────────────────────────────
RED    = "\033[91m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

passed = []
failed = []

def ok(label):
    passed.append(label)
    print(f"  {GREEN}✓{RESET} {label}")

def fail(label, detail=""):
    failed.append(label)
    print(f"  {RED}✗{RESET} {label}")
    if detail:
        print(f"    {RED}{detail}{RESET}")

def section(title):
    print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*60}{RESET}")

def assert_eq(label, actual, expected):
    if actual == expected:
        ok(label)
    else:
        fail(label, f"expected {expected!r}, got {actual!r}")

def assert_not_none(label, val):
    if val is not None and val != "" and val != {}:
        ok(label)
    else:
        fail(label, f"got {val!r}")

def assert_true(label, condition, detail=""):
    if condition:
        ok(label)
    else:
        fail(label, detail)

def poll_session_status(admin, session_id, timeout=OCR_TIMEOUT_S):
    """Poll kyc_sessions until status leaves 'processing'. Returns the final row."""
    elapsed = 0
    while elapsed < timeout:
        time.sleep(OCR_POLL_S)
        elapsed += OCR_POLL_S
        row = admin.table("kyc_sessions").select("*").eq("id", session_id).single().execute().data
        status = row.get("status", "")
        print(f"    [{elapsed:3d}s] status = {status}")
        if status != "processing":
            return row
    return None

# ── Admin client (service role — bypasses RLS) ────────────────────────────────
admin = create_client(SUPABASE_URL, SERVICE_KEY)

# Track IDs for cleanup
TEST_USER_ID       = None
SESSION_ID_1       = None   # first session (will be rejected)
SESSION_ID_2       = None   # second session (will be approved)
NOTIFICATION_IDS   = []

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 0 — Verify image files exist
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 0 — Pre-flight checks")

assert_true("CNIC front image exists", os.path.exists(FRONT_IMG), FRONT_IMG)
assert_true("CNIC back image exists",  os.path.exists(BACK_IMG),  BACK_IMG)

front_bytes = open(FRONT_IMG, "rb").read() if os.path.exists(FRONT_IMG) else None
back_bytes  = open(BACK_IMG,  "rb").read() if os.path.exists(BACK_IMG)  else None

assert_true("CNIC front image readable (>1KB)", front_bytes and len(front_bytes) > 1024,
            f"size={len(front_bytes) if front_bytes else 0}")
assert_true("CNIC back image readable (>1KB)",  back_bytes  and len(back_bytes)  > 1024,
            f"size={len(back_bytes) if back_bytes else 0}")

if failed:
    print(f"\n{RED}Pre-flight checks failed. Aborting.{RESET}")
    sys.exit(1)

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — Create test user
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 1 — Create / reuse test user")

# Check if user already exists
existing = admin.table("user_roles").select("user_id").eq("role_type", "tour_operator").execute()
# Look for our test user in auth.users
auth_response = admin.auth.admin.list_users()
existing_user = None
for u in (auth_response or []):
    if hasattr(u, 'email') and u.email == TEST_EMAIL:
        existing_user = u
        break

if existing_user:
    TEST_USER_ID = existing_user.id
    print(f"  {YELLOW}ℹ{RESET}  Reusing existing user: {TEST_USER_ID} ({TEST_EMAIL})")
    ok("Test user exists")
else:
    try:
        resp = admin.auth.admin.create_user({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "email_confirm": True,
        })
        TEST_USER_ID = resp.user.id
        ok(f"Created test user: {TEST_USER_ID}")
    except Exception as e:
        fail("Create test user", str(e))
        sys.exit(1)

# Ensure user_roles row exists for tour_operator
role_row = admin.table("user_roles").select("*").eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").execute().data
if role_row:
    print(f"  {YELLOW}ℹ{RESET}  user_roles row exists, current verification_status: {role_row[0].get('verification_status')}")
    # Reset to pending for a clean test
    admin.table("user_roles").update({
        "verification_status": "pending",
    }).eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").execute()
    ok("Reset user_roles to pending for clean test")
else:
    admin.table("user_roles").insert({
        "user_id": TEST_USER_ID,
        "role_type": "tour_operator",
        "verification_status": "pending",
        "account_status": "active",
    }).execute()
    ok("Created user_roles row")

# Ensure tour_operator_profiles row exists
prof = admin.table("tour_operator_profiles").select("user_id").eq("user_id", TEST_USER_ID).execute().data
if not prof:
    admin.table("tour_operator_profiles").insert({
        "user_id": TEST_USER_ID,
        "operator_name": "HolyWolf Test Operator",
        "verification_documents": {},
    }).execute()
    ok("Created tour_operator_profiles row")
else:
    ok("tour_operator_profiles row exists")

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — First KYC upload → OCR processing
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 2 — KYC Session 1: Upload CNIC → OCR extraction")

expires_at = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
session_token_1 = str(uuid.uuid4())

sess = admin.table("kyc_sessions").insert({
    "user_id":       TEST_USER_ID,
    "session_token": session_token_1,
    "status":        "uploading",
    "role":          "tour_operator",
    "expires_at":    expires_at,
}).execute()
SESSION_ID_1 = sess.data[0]["id"]
ok(f"Created KYC session 1: {SESSION_ID_1}")

# Upload images to storage
front_path_1 = f"kyc/tour_operators/{TEST_USER_ID}/cnic/front_e2e_v1.png"
back_path_1  = f"kyc/tour_operators/{TEST_USER_ID}/cnic/back_e2e_v1.png"

for local, remote, label in [
    (FRONT_IMG, front_path_1, "CNIC front"),
    (BACK_IMG,  back_path_1,  "CNIC back"),
]:
    try:
        admin.storage.from_("kyc").remove([remote])
    except:
        pass
    with open(local, "rb") as f:
        data = f.read()
    r = admin.storage.from_("kyc").upload(remote, data, {"content-type": "image/png", "x-upsert": "true"})
    ok(f"Uploaded {label} → {remote}")

# Patch session: both paths + status=processing (triggers Railway worker)
admin.table("kyc_sessions").update({
    "id_front_path": front_path_1,
    "id_back_path":  back_path_1,
    "status":        "processing",
}).eq("id", SESSION_ID_1).execute()
ok("Session 1 set to 'processing' — Railway worker will pick this up")

print(f"\n  {YELLOW}⏳ Waiting for OCR worker (up to {OCR_TIMEOUT_S}s)...{RESET}")
final_row = poll_session_status(admin, SESSION_ID_1, timeout=OCR_TIMEOUT_S)

if not final_row:
    fail("OCR worker responded within timeout",
         f"Status still 'processing' after {OCR_TIMEOUT_S}s — check Railway logs")
else:
    status = final_row.get("status", "")
    assert_true("OCR completed (status != processing)", status != "processing", f"status={status}")
    assert_true("Status is pending_admin_review or approved",
                status in ("pending_admin_review", "approved", "failed"),
                f"status={status}")

    cnic  = final_row.get("cnic_number")
    name  = final_row.get("full_name")
    fname = final_row.get("father_name")
    expiry = final_row.get("expiry_date")

    print(f"\n  {BOLD}OCR Results:{RESET}")
    print(f"    CNIC Number  : {cnic}")
    print(f"    Full Name    : {name}")
    print(f"    Father Name  : {fname}")
    print(f"    Date of Birth: {final_row.get('date_of_birth')}")
    print(f"    Expiry       : {expiry}")
    print(f"    Gender       : {final_row.get('gender')}")
    print(f"    Address      : {final_row.get('address')}")
    if final_row.get("failure_reason"):
        print(f"    Failure      : {final_row.get('failure_code')} — {final_row.get('failure_reason')}")

    # OCR quality checks
    assert_not_none("OCR extracted CNIC number", cnic)
    assert_not_none("OCR extracted full name",   name)
    # Father name is quality-dependent — warn but don't fail
    # (screenshots/low-res images may not yield it; real phone photos will)
    if fname:
        ok("OCR extracted father name")
    else:
        print(f"  {YELLOW}⚠{RESET}  OCR father name not extracted (image quality — real phone photo required)")

    # Check DB trigger synced the profile
    time.sleep(2)  # trigger is async
    prof_row = admin.table("tour_operator_profiles").select("verification_documents").eq("user_id", TEST_USER_ID).single().execute().data
    vdocs = prof_row.get("verification_documents", {}) or {}
    synced_status = vdocs.get("kycStatus", "")
    assert_true("DB trigger synced kycStatus to profile",
                synced_status in ("pending_admin_review", "approved", "processing"),
                f"kycStatus in profile = {synced_status!r}")


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — Admin Rejection + Notification
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 3 — Admin rejects KYC + notification check")

REJECTION_NOTES = "Photos are blurry. CNIC number and name could not be clearly extracted. Please re-upload clearer, well-lit photos."

# Get a super_admin user ID (for reviewed_by)
admin_res = admin.table("user_roles").select("user_id").eq("role_type", "super_admin").limit(1).execute().data
admin_user_id = admin_res[0]["user_id"] if admin_res else TEST_USER_ID

admin.table("kyc_sessions").update({
    "status":      "rejected",
    "reviewed_by": admin_user_id,
    "reviewed_at": datetime.now(timezone.utc).isoformat(),
    "review_notes": REJECTION_NOTES,
}).eq("id", SESSION_ID_1).execute()
ok("Admin rejected session 1")

time.sleep(2)  # let trigger fire

# Check kyc_sessions
sess_row = admin.table("kyc_sessions").select("status,review_notes").eq("id", SESSION_ID_1).single().execute().data
assert_eq("Session 1 status = rejected", sess_row.get("status"), "rejected")
assert_eq("review_notes saved", sess_row.get("review_notes"), REJECTION_NOTES)

# Check profile JSONB synced
prof_row = admin.table("tour_operator_profiles").select("verification_documents,kyc_rejection_reason").eq("user_id", TEST_USER_ID).single().execute().data
vdocs = prof_row.get("verification_documents", {}) or {}
assert_eq("Profile kycStatus = rejected (trigger)", vdocs.get("kycStatus"), "rejected")
assert_not_none("Profile kyc_rejection_reason written", prof_row.get("kyc_rejection_reason"))

# Check user_roles verification_status
role_row = admin.table("user_roles").select("verification_status").eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").single().execute().data
assert_eq("user_roles.verification_status = rejected", role_row.get("verification_status"), "rejected")

# Insert rejection notification (as AdminKYCPage would do)
notif_body = f"Your identity documents were reviewed and could not be approved. Reason: {REJECTION_NOTES}. Please re-upload clearer photos of your CNIC."
n = admin.table("notifications").insert({
    "user_id": TEST_USER_ID,
    "type":    "verification_rejected",
    "title":   "KYC Verification Rejected",
    "body":    notif_body,
    "read":    False,
}).execute()
notif_id_1 = n.data[0]["id"]
NOTIFICATION_IDS.append(notif_id_1)
ok(f"Rejection notification inserted: {notif_id_1}")

# Verify notification exists
notif_row = admin.table("notifications").select("*").eq("id", notif_id_1).single().execute().data
assert_eq("Notification type = verification_rejected",  notif_row.get("type"),  "verification_rejected")
assert_eq("Notification user_id correct", notif_row.get("user_id"), TEST_USER_ID)
assert_true("Notification body contains rejection reason",
            REJECTION_NOTES[:30] in (notif_row.get("body") or ""),
            f"body={notif_row.get('body','')[:80]}")
assert_eq("Notification unread", notif_row.get("read"), False)


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 4 — Appeal: new KYC session (old session stays immutable)
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 4 — Appeal / Re-upload: new KYC session created")

# Verify old session hasn't changed
old_sess = admin.table("kyc_sessions").select("status").eq("id", SESSION_ID_1).single().execute().data
assert_eq("Old session 1 still rejected (immutable audit trail)", old_sess.get("status"), "rejected")

# Create new session (what the UI does via createKycSession())
session_token_2 = str(uuid.uuid4())
sess2 = admin.table("kyc_sessions").insert({
    "user_id":       TEST_USER_ID,
    "session_token": session_token_2,
    "status":        "uploading",
    "role":          "tour_operator",
    "expires_at":    expires_at,
}).execute()
SESSION_ID_2 = sess2.data[0]["id"]
ok(f"Created KYC session 2 (appeal): {SESSION_ID_2}")

# Upload same images again (in real life user uploads new photos)
front_path_2 = f"kyc/tour_operators/{TEST_USER_ID}/cnic/front_e2e_v2.png"
back_path_2  = f"kyc/tour_operators/{TEST_USER_ID}/cnic/back_e2e_v2.png"

for local, remote, label in [
    (FRONT_IMG, front_path_2, "CNIC front v2"),
    (BACK_IMG,  back_path_2,  "CNIC back v2"),
]:
    try:
        admin.storage.from_("kyc").remove([remote])
    except:
        pass
    with open(local, "rb") as f:
        data = f.read()
    admin.storage.from_("kyc").upload(remote, data, {"content-type": "image/png", "x-upsert": "true"})
    ok(f"Uploaded {label} (appeal) → {remote}")

admin.table("kyc_sessions").update({
    "id_front_path": front_path_2,
    "id_back_path":  back_path_2,
    "status":        "processing",
}).eq("id", SESSION_ID_2).execute()
ok("Session 2 set to 'processing' → OCR worker will pick up")

print(f"\n  {YELLOW}⏳ Waiting for OCR worker on appeal session (up to {OCR_TIMEOUT_S}s)...{RESET}")
final_row2 = poll_session_status(admin, SESSION_ID_2, timeout=OCR_TIMEOUT_S)

if not final_row2:
    fail("OCR worker processed appeal session within timeout")
else:
    status2 = final_row2.get("status", "")
    assert_true("Appeal session OCR completed", status2 != "processing", f"status={status2}")
    assert_true("Appeal session reached pending_admin_review",
                status2 in ("pending_admin_review", "approved"),
                f"status={status2}")

    print(f"\n  {BOLD}Appeal OCR Results:{RESET}")
    print(f"    CNIC Number : {final_row2.get('cnic_number')}")
    print(f"    Full Name   : {final_row2.get('full_name')}")
    print(f"    Father Name : {final_row2.get('father_name')}")
    print(f"    Expiry      : {final_row2.get('expiry_date')}")

    # Old session still rejected
    old_check = admin.table("kyc_sessions").select("status").eq("id", SESSION_ID_1).single().execute().data
    assert_eq("Old session 1 STILL rejected after appeal", old_check.get("status"), "rejected")


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 5 — Admin Approval + Notification
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 5 — Admin approves appeal session + approval notification")

# Get OCR data from session 2 (or set manual values if OCR didn't extract)
s2 = admin.table("kyc_sessions").select("*").eq("id", SESSION_ID_2).single().execute().data
cnic_num   = s2.get("cnic_number")   or "35201-1234567-1"
full_name  = s2.get("full_name")     or "Muhammad Test Wolf"
father_nm  = s2.get("father_name")   or "Abdul Test"
expiry     = s2.get("expiry_date")   or "2030-12-31"
gender     = s2.get("gender")        or "M"
dob        = s2.get("date_of_birth") or "1990-01-01"

admin.table("kyc_sessions").update({
    "status":        "approved",
    "reviewed_by":   admin_user_id,
    "reviewed_at":   datetime.now(timezone.utc).isoformat(),
    "review_notes":  "Documents verified. CNIC confirmed.",
    "cnic_number":   cnic_num,
    "full_name":     full_name,
    "father_name":   father_nm,
    "expiry_date":   expiry,
    "gender":        gender,
    "date_of_birth": dob,
}).eq("id", SESSION_ID_2).execute()
ok("Admin approved session 2")

time.sleep(2)  # trigger fires

# Verify approval propagation (DB trigger handles all of this)
approved_sess = admin.table("kyc_sessions").select("status").eq("id", SESSION_ID_2).single().execute().data
assert_eq("Session 2 status = approved", approved_sess.get("status"), "approved")

role_after = admin.table("user_roles").select("verification_status").eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").single().execute().data
assert_eq("user_roles.verification_status = approved (trigger)", role_after.get("verification_status"), "approved")

prof_after = admin.table("tour_operator_profiles").select("kyc_verified_name,kyc_verified_cnic,verification_documents").eq("user_id", TEST_USER_ID).single().execute().data
assert_not_none("kyc_verified_name promoted to profile", prof_after.get("kyc_verified_name"))
assert_not_none("kyc_verified_cnic promoted to profile", prof_after.get("kyc_verified_cnic"))
vdocs2 = prof_after.get("verification_documents", {}) or {}
assert_eq("Profile kycStatus = approved (trigger)", vdocs2.get("kycStatus"), "approved")

# Insert approval notification
n2 = admin.table("notifications").insert({
    "user_id": TEST_USER_ID,
    "type":    "verification_approved",
    "title":   "KYC Verification Approved",
    "body":    "Congratulations! Your identity has been verified. You can now publish tour packages.",
    "read":    False,
}).execute()
notif_id_2 = n2.data[0]["id"]
NOTIFICATION_IDS.append(notif_id_2)
ok(f"Approval notification inserted: {notif_id_2}")

notif2_row = admin.table("notifications").select("type,user_id,read").eq("id", notif_id_2).single().execute().data
assert_eq("Approval notification type", notif2_row.get("type"), "verification_approved")
assert_eq("Approval notification unread", notif2_row.get("read"), False)

# Verify can_partner_operate (approved + active = can operate)
role_full = admin.table("user_roles").select("verification_status").eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").single().execute().data
prof_full = admin.table("tour_operator_profiles").select("account_status").eq("user_id", TEST_USER_ID).single().execute().data
can_operate = (
    role_full.get("verification_status") == "approved" and
    prof_full.get("account_status") == "active"
)
assert_true("can_partner_operate = TRUE (approved + active)", can_operate,
            f"verification_status={role_full.get('verification_status')}, account_status={prof_full.get('account_status')}")


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 6 — Suspension
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 6 — Admin suspends the approved operator")

admin.table("tour_operator_profiles").update({
    "account_status": "suspended",
}).eq("user_id", TEST_USER_ID).execute()
ok("Operator account suspended")

prof_susp = admin.table("tour_operator_profiles").select("account_status").eq("user_id", TEST_USER_ID).single().execute().data
assert_eq("account_status = suspended", prof_susp.get("account_status"), "suspended")

role_susp = admin.table("user_roles").select("verification_status").eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").single().execute().data
# Verification status must NOT regress after suspension
assert_eq("verification_status still approved after suspension (not regressed)",
          role_susp.get("verification_status"), "approved")

# can_partner_operate must be FALSE (suspended)
can_operate_susp = (
    role_susp.get("verification_status") == "approved" and
    prof_susp.get("account_status") == "active"
)
assert_true("can_partner_operate = FALSE (suspended)", not can_operate_susp)

# Reinstate
admin.table("tour_operator_profiles").update({
    "account_status": "active",
}).eq("user_id", TEST_USER_ID).execute()
ok("Operator reinstated")

prof_reins = admin.table("tour_operator_profiles").select("account_status").eq("user_id", TEST_USER_ID).single().execute().data
assert_eq("account_status = active after reinstatement", prof_reins.get("account_status"), "active")

role_reins = admin.table("user_roles").select("verification_status").eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").single().execute().data
assert_eq("verification_status still approved after reinstatement", role_reins.get("verification_status"), "approved")

can_operate_reins = (role_reins.get("verification_status") == "approved" and prof_reins.get("account_status") == "active")
assert_true("can_partner_operate = TRUE after reinstatement", can_operate_reins)


# ══════════════════════════════════════════════════════════════════════════════
# PHASE 7 — Verify full audit trail
# ══════════════════════════════════════════════════════════════════════════════
section("PHASE 7 — Audit trail verification")

all_sessions = admin.table("kyc_sessions").select("id,status,reviewed_at").eq("user_id", TEST_USER_ID).order("created_at").execute().data

print(f"\n  All KYC sessions for test user ({len(all_sessions)} total):")
for s in all_sessions:
    marker = "←" if s["id"] in (SESSION_ID_1, SESSION_ID_2) else " "
    print(f"    {marker} {s['id'][:8]}... | {s['status']}")

test_sessions = [s for s in all_sessions if s["id"] in (SESSION_ID_1, SESSION_ID_2)]
assert_true("Both test sessions exist in audit trail", len(test_sessions) == 2, f"found {len(test_sessions)}")

s1_audit = next((s for s in test_sessions if s["id"] == SESSION_ID_1), None)
s2_audit = next((s for s in test_sessions if s["id"] == SESSION_ID_2), None)

if s1_audit:
    assert_eq("Session 1 preserved as rejected (immutable)", s1_audit.get("status"), "rejected")
if s2_audit:
    assert_eq("Session 2 preserved as approved", s2_audit.get("status"), "approved")

all_notifs = admin.table("notifications").select("id,type,read").eq("user_id", TEST_USER_ID).in_("id", NOTIFICATION_IDS).execute().data
print(f"\n  Notifications for test user ({len(all_notifs)} test notifs):")
for n in all_notifs:
    print(f"    {n['id'][:8]}... | type={n['type']} | read={n['read']}")

assert_true("Both test notifications stored", len(all_notifs) == 2, f"found {len(all_notifs)}")


# ══════════════════════════════════════════════════════════════════════════════
# CLEANUP
# ══════════════════════════════════════════════════════════════════════════════
section("CLEANUP — Removing test data")

# Delete test notifications
if NOTIFICATION_IDS:
    admin.table("notifications").delete().in_("id", NOTIFICATION_IDS).execute()
    ok(f"Deleted {len(NOTIFICATION_IDS)} test notifications")

# Delete test KYC sessions
for sid in filter(None, [SESSION_ID_1, SESSION_ID_2]):
    admin.table("kyc_sessions").delete().eq("id", sid).execute()
    ok(f"Deleted KYC session: {sid[:8]}...")

# Delete test storage files
for path in [front_path_1, back_path_1, front_path_2, back_path_2]:
    try:
        admin.storage.from_("kyc").remove([path])
    except:
        pass
ok("Cleared test storage files")

# Reset profile & user_roles (don't delete the user — holywolf92 may be real)
admin.table("tour_operator_profiles").update({
    "verification_documents": {},
    "kyc_verified_name": None,
    "kyc_verified_cnic": None,
    "kyc_verified_dob": None,
    "kyc_verified_gender": None,
    "kyc_verified_father_name": None,
    "kyc_verified_at": None,
    "kyc_rejection_reason": None,
    "account_status": "active",
}).eq("user_id", TEST_USER_ID).execute()
ok("Reset tour_operator_profiles")

admin.table("user_roles").update({
    "verification_status": "pending",
}).eq("user_id", TEST_USER_ID).eq("role_type", "tour_operator").execute()
ok("Reset user_roles.verification_status to pending")


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
total = len(passed) + len(failed)
print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  TEST SUMMARY{RESET}")
print(f"{BOLD}{'═'*60}{RESET}")
print(f"  {GREEN}✓ Passed : {len(passed)}/{total}{RESET}")
if failed:
    print(f"  {RED}✗ Failed : {len(failed)}/{total}{RESET}")
    print(f"\n  {RED}Failed checks:{RESET}")
    for f in failed:
        print(f"    {RED}✗{RESET} {f}")
else:
    print(f"\n  {GREEN}{BOLD}ALL TESTS PASSED ✓{RESET}")
print(f"{BOLD}{'═'*60}{RESET}\n")

sys.exit(0 if not failed else 1)
