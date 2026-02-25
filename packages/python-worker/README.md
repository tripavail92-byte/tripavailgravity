# TripAvail Background Python Worker

## The Problem

The original KYC identity verification flow relied on expensive and rate-limited third-party AI APIs (like OpenAI Vision). This caused two major issues:

1. **API Cost:** Sending high-resolution IDs and selfies to commercial AI models is expensive at scale.
2. **Rate Limits & Blocking:** The synchronous edge-function hit `429 Too Many Requests` errors when traffic spiked, blocking users from completing their partner setup.

## The Solution

We migrated the expensive synchronous AI checks to an **asynchronous, open-source background worker**.

Instead of waiting for an Edge Function to process images, the Supabase database acts as a reliable queue. When a user uploads their KYC documents, their session is marked as `processing`. This standalone Python worker continuously polls Supabase, downloads the images, runs free local AI models, and writes the `complete` or `failed` status back to the database. The frontend listens to these database changes via Realtime and updates the UI instantly.

## Technology Stack

- **DeepFace (VGG-Face / Facenet512 / RetinaFace):** Open-source library used to extract faces from the ID card and match them against the selfie to verify physical identity. No external API required.
- **EasyOCR:** A robust library that extracts text directly from the ID card image for data verification, keeping sensitive ID details entirely on our own infrastructure without sending them to OpenAI.
- **Supabase Realtime (PostgreSQL):** Used as the messaging queue holding the pending KYC sessions.
- **uv:** An ultra-fast Python package installer written in Rust, which resolves heavy ML dependencies 10-100x faster than standard pip.

---

## Architecture & Created Files

### 1. `worker.py`

The core engine of the microservice.

- Loops indefinitely, querying Supabase for records where `status = 'processing'`.
- Downloads `selfie_url` and `id_front_url`.
- Uses **DeepFace** to run a facial verification score.
- Uses **EasyOCR** to extract ID text details.
- Updates the Supabase record with `match`, `match_score`, `ocr_result`, and marks the status as `complete`.

### 2. `requirements.txt`

The strict list of necessary Python libraries:

- `supabase` (DB access)
- `deepface` (Facial matching)
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
