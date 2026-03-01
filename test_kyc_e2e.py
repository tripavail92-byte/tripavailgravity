"""
End-to-end KYC test: upload real CNIC images → Railway worker processes → show extracted fields.
"""
import sys, time, uuid, os
from supabase import create_client

SUPABASE_URL = "https://zkhppxjeaizpyinfpecj.supabase.co"
SERVICE_KEY  = open("supabase-secrets.env").read()
# parse SERVICE_ROLE_KEY from the env file
for line in SERVICE_KEY.splitlines():
    if line.startswith("SERVICE_ROLE_KEY="):
        SERVICE_KEY = line.split("=", 1)[1].strip()
        break

FRONT_IMG = r"D:\Tripfinal\docs\Screenshot 2026-02-28 193749.png"
BACK_IMG  = r"D:\Tripfinal\docs\Screenshot 2026-02-28 193823.png"

supabase = create_client(SUPABASE_URL, SERVICE_KEY)

# ── 1. Pick any existing tour_operator user to attach the test session to ──
user_res = supabase.table("user_roles").select("user_id").eq("role_type", "tour_operator").limit(1).execute()
if not user_res.data:
    print("ERROR: No tour_operator users found in DB")
    sys.exit(1)
test_user_id = user_res.data[0]["user_id"]
print(f"Using test user: {test_user_id}")

# ── 2. Create a KYC session ───────────────────────────────────────────────
session_token = str(uuid.uuid4())
expires_at = "2026-12-31T23:59:59Z"
sess_res = supabase.table("kyc_sessions").insert({
    "user_id":       test_user_id,
    "session_token": session_token,
    "status":        "uploading",
    "role":          "tour_operator",
    "expires_at":    expires_at,
}).execute()
session_id = sess_res.data[0]["id"]
print(f"Created session: {session_id}")

# ── 3. Upload images to kyc bucket ───────────────────────────────────────
front_path = f"kyc/tour_operators/{test_user_id}/cnic/front_test.png"
back_path  = f"kyc/tour_operators/{test_user_id}/cnic/back_test.png"

for local, remote in [(FRONT_IMG, front_path), (BACK_IMG, back_path)]:
    with open(local, "rb") as f:
        data = f.read()
    # remove if exists
    supabase.storage.from_("kyc").remove([remote])
    res = supabase.storage.from_("kyc").upload(remote, data, {"content-type": "image/png"})
    print(f"Uploaded {remote}")

# ── 4. Set both paths and status=processing ───────────────────────────────
supabase.table("kyc_sessions").update({
    "id_front_path": front_path,
    "id_back_path":  back_path,
    "status":        "processing",
}).eq("id", session_id).execute()
print(f"\nSession set to 'processing' — waiting for Railway worker...\n")

# ── 5. Poll until worker finishes (up to 60s) ────────────────────────────
for i in range(20):
    time.sleep(3)
    row = supabase.table("kyc_sessions").select("*").eq("id", session_id).single().execute().data
    status = row["status"]
    print(f"  [{i*3:2d}s] status = {status}")
    if status not in ("processing",):
        print(f"\n--- Worker finished: {status} ---")
        print(f"  CNIC Number : {row.get('cnic_number')}")
        print(f"  Full Name   : {row.get('full_name')}")
        print(f"  Father Name : {row.get('father_name')}")
        print(f"  Gender      : {row.get('gender')}")
        print(f"  DOB         : {row.get('date_of_birth')}")
        print(f"  Expiry      : {row.get('expiry_date')}")
        print(f"  Address     : {row.get('address')}")
        if row.get("failure_reason"):
            print(f"  Failure     : {row.get('failure_code')} — {row.get('failure_reason')}")
        # Show raw OCR segments for debugging
        ocr = row.get("ocr_result") or {}
        segments = (ocr.get("front_components") or []) + (ocr.get("back_components") or [])
        if segments:
            print(f"\n  OCR segments ({len(segments)} total):")
            for s in segments[:25]:
                print(f"    [{s}]")
        # Cleanup
        supabase.table("kyc_sessions").delete().eq("id", session_id).execute()
        supabase.storage.from_("kyc").remove([front_path, back_path])
        print("\nTest session cleaned up.")
        sys.exit(0)

print("TIMEOUT: Worker did not process within 60s — check Railway logs")
supabase.table("kyc_sessions").delete().eq("id", session_id).execute()
