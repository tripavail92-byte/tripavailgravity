# TripAvail Background Python Worker

## The Problem

The original KYC identity verification flow relied on expensive and rate-limited synchronous AI calls and included biometric (selfie/face matching) logic. This caused two major issues:

1. **API Cost:** Sending high-resolution IDs and selfies to commercial AI models is expensive at scale.
2. **Rate Limits & Blocking:** The synchronous edge-function hit `429 Too Many Requests` errors when traffic spiked, blocking users from completing their partner setup.

## The Solution

We migrated verification to an **asynchronous, open-source background worker** and simplified KYC to **CNIC front/back only**.

Instead of waiting for an Edge Function to do heavy work, the Supabase database acts as a reliable queue. When a user uploads **both** CNIC images, the session is marked as `processing`. This worker continuously polls Supabase, downloads the private storage objects, runs OCR + validations, and then writes either `pending_admin_review` or `failed` back to the database.

## Technology Stack

- **EasyOCR:** Extracts text from CNIC images.
- **Supabase Realtime (PostgreSQL):** Used as the messaging queue holding the pending KYC sessions.
- **Supabase Storage (private bucket):** Stores CNIC front/back as private objects; the worker downloads using the service role key.

---

## Architecture & Created Files

### 1. `worker.py`

The core engine of the microservice.

- Loops indefinitely, querying Supabase for records where `status = 'processing'`.
- Downloads `id_front_path` and `id_back_path` (private storage paths).
- Uses **EasyOCR** to extract CNIC number and relevant dates.
- Validations:
	- CNIC regex/format must be valid
	- CNIC must not be blocked (`kyc_blocked_cnics`)
	- CNIC must not be duplicate across other users with `pending_admin_review` / `approved`
	- Expiry date (if detected) must not be in the past
- Updates the Supabase record with structured columns (`cnic_number`, `date_of_birth`, `expiry_date`), stores `ocr_result`, and transitions to `pending_admin_review` or `failed` (with `failure_code`/`failure_reason`).

### 2. `requirements.txt`

The strict list of necessary Python libraries:

- `supabase` (DB access)
- `easyocr` (Text extraction)
- `python-dotenv` (Local environment variables)

### 3. `Dockerfile`

The container configuration required to deploy this worker to any VPS or cloud host (like Railway).

- Built on `python:3.10-slim`.
- Installs low-level system Linux libraries required by OpenCV (which powers both ML tools).
- Installs dependencies using `uv` to ensure fast container booting.
- Runs `worker.py` constantly.

### 4. `railway.json` & `.railwayignore`

Configuration files required to deploy this specific folder within a monorepo setup to the Railway cloud platform. Enables Railway to see this directory as a unique microservice.

---

## Environment Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KYC_BUCKET` (default: `tour-operator-assets`)

Optional hardening:

- `KYC_CNIC_HASH_PEPPER` (default: empty)
	- If set, the worker checks `public.blocked_cnic_registry(cnic_hash)` where `cnic_hash = sha256(pepper + normalized_cnic)`.
	- This supports blocking CNICs without storing them in cleartext.

Payout automation:

- `PAYOUT_AUTOMATION_ENABLED` (default: `true`)
	- Enables the same Railway worker to refresh operator payout eligibility and create payout batches automatically.
- `PAYOUT_AUTOMATION_INTERVAL_SECONDS` (default: `300`)
	- Controls how often the worker runs the payout automation cycle.
- `PAYOUT_AUTOMATION_AUTO_SETTLE` (default: `false`)
	- If enabled, newly created payout batches are immediately marked paid after batch creation.
