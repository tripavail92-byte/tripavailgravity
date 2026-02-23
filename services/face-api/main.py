"""
TripAvail Face Verification Microservice
Powered by DeepFace (FaceNet-512 model) — zero per-call cost.

Routes:
  POST /verify   — compare two face images, return match + confidence
  GET  /health   — liveness probe for Railway

Auth: Bearer token via FACE_API_SECRET env var.
"""

import os
import io
import asyncio
import logging
import tempfile
from pathlib import Path

import httpx
import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, HttpUrl
from deepface import DeepFace

# ── Config ──────────────────────────────────────────────────────────────────
MODEL_NAME     = os.getenv("DEEPFACE_MODEL", "Facenet512")  # Facenet512 | ArcFace | VGG-Face
DETECTOR       = os.getenv("DEEPFACE_DETECTOR", "retinaface")  # retinaface | mtcnn | opencv
DISTANCE_METRIC= os.getenv("DEEPFACE_METRIC", "cosine")
API_SECRET     = os.getenv("FACE_API_SECRET", "")           # must be set in Railway
MATCH_THRESHOLD= float(os.getenv("MATCH_THRESHOLD", "0.40")) # cosine distance ≤ threshold = match
                                                             # FaceNet512+cosine: 0.30 typical
PORT           = int(os.getenv("PORT", "8000"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("face-api")

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="TripAvail Face API", version="1.0.0", docs_url=None, redoc_url=None)
bearer = HTTPBearer(auto_error=False)


def require_auth(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not API_SECRET:
        raise HTTPException(500, "FACE_API_SECRET not configured on server")
    if not creds or creds.credentials != API_SECRET:
        raise HTTPException(401, "Unauthorized — invalid or missing Bearer token")
    return True


# ── Models ───────────────────────────────────────────────────────────────────
class VerifyRequest(BaseModel):
    id_url:     HttpUrl      # URL of the ID card face crop (or full ID photo)
    selfie_url: HttpUrl      # URL of the selfie
    min_face_confidence: float = 0.90  # retinaface detection confidence threshold


class VerifyResponse(BaseModel):
    match:      bool
    score:      int          # 0-100 similarity percentage
    distance:   float        # raw cosine distance (lower = more similar)
    method:     str
    reason:     str


# ── Helpers ──────────────────────────────────────────────────────────────────
async def fetch_image(url: str) -> np.ndarray:
    """Download an image URL and return as RGB numpy array."""
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(str(url), headers={"User-Agent": "TripAvail-FaceAPI/1.0"})
    if resp.status_code != 200:
        raise HTTPException(400, f"Could not fetch image ({resp.status_code}): {url}")
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    return np.array(img)


def similarity_to_score(distance: float, threshold: float) -> int:
    """Convert cosine distance to a 0-100 similarity score."""
    # At distance=0 → 100%, at distance=threshold → 50%, beyond → <50%
    score = max(0, min(100, int(100 * (1 - distance / (threshold * 2)))))
    return score


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_NAME, "detector": DETECTOR}


@app.post("/verify", response_model=VerifyResponse, dependencies=[Depends(require_auth)])
async def verify_faces(body: VerifyRequest):
    log.info("verify request received")

    # Download both images concurrently
    try:
        id_img, selfie_img = await asyncio.gather(
            fetch_image(str(body.id_url)),
            fetch_image(str(body.selfie_url)),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Image fetch error: {e}")

    # Write to temp files (DeepFace accepts file paths or numpy arrays)
    with tempfile.TemporaryDirectory() as tmpdir:
        id_path     = Path(tmpdir) / "id.jpg"
        selfie_path = Path(tmpdir) / "selfie.jpg"
        Image.fromarray(id_img).save(id_path, "JPEG")
        Image.fromarray(selfie_img).save(selfie_path, "JPEG")

        try:
            result = DeepFace.verify(
                img1_path    = str(id_path),
                img2_path    = str(selfie_path),
                model_name   = MODEL_NAME,
                detector_backend = DETECTOR,
                distance_metric  = DISTANCE_METRIC,
                enforce_detection= True,
                silent           = True,
            )
        except ValueError as e:
            # DeepFace raises ValueError when no face is detected
            msg = str(e).lower()
            if "face could not be detected" in msg or "no face" in msg:
                subject = "ID card" if "img1" in msg else "selfie"
                return VerifyResponse(
                    match    = False,
                    score    = 0,
                    distance = 1.0,
                    method   = f"deepface-{MODEL_NAME}",
                    reason   = f"No face detected in the {subject}. Ensure the image is clear and well-lit.",
                )
            raise HTTPException(422, f"Face analysis error: {e}")
        except Exception as e:
            log.exception("DeepFace.verify error")
            raise HTTPException(500, f"Face comparison failed: {e}")

    distance  = round(result.get("distance", 1.0), 4)
    threshold = result.get("threshold", MATCH_THRESHOLD)
    matched   = result.get("verified", False)
    score     = similarity_to_score(distance, threshold)

    reason = (
        f"DeepFace ({MODEL_NAME}) confirmed identity match with {score}% similarity (distance: {distance})."
        if matched else
        f"Face match failed — similarity {score}% (distance: {distance}, threshold: ≤{threshold}). "
        "Please retake your selfie in good lighting, facing the camera directly."
    )

    log.info("verify complete: match=%s score=%d distance=%s", matched, score, distance)
    return VerifyResponse(
        match    = matched,
        score    = score,
        distance = distance,
        method   = f"deepface-{MODEL_NAME}",
        reason   = reason,
    )


# ── Entry point (Railway uses $PORT) ─────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, log_level="info")
