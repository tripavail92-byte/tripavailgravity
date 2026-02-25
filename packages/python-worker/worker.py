import os
import time
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import tempfile

# Suppress deepface/tf warnings if possible
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from deepface import DeepFace
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

# ── Config ──────────────────────────────────────────────────────────────────
MODEL_NAME     = os.getenv("DEEPFACE_MODEL", "Facenet512")
DETECTOR       = os.getenv("DEEPFACE_DETECTOR", "retinaface")
DISTANCE_METRIC= os.getenv("DEEPFACE_METRIC", "cosine")
MATCH_THRESHOLD= float(os.getenv("MATCH_THRESHOLD", "0.40")) # cosine distance ≤ threshold = match

def similarity_to_score(distance: float, threshold: float) -> int:
    """Convert cosine distance to a 0-100 similarity score."""
    # At distance=0 → 100%, at distance=threshold → 50%, beyond → <50%
    score = max(0, min(100, int(100 * (1 - distance / (threshold * 2)))))
    return score

def download_image(url: str, suffix=".jpg") -> str:
    """Download image to a temporary file and return the path."""
    response = requests.get(url)
    response.raise_for_status()
    
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, 'wb') as f:
        f.write(response.content)
    return path

def process_session(session):
    session_token = session['session_token']
    user_id = session['user_id']
    logger.info(f"Processing session: {session_token} for user: {user_id}")
    
    id_front_url = session.get('id_front_url')
    selfie_url = session.get('selfie_url')
    
    if not id_front_url or not selfie_url:
        logger.error(f"Missing required images for session {session_token}")
        supabase.table("kyc_sessions").update({
            "status": "failed",
            "match_reason": "Missing ID Front or Selfie image."
        }).eq("session_token", session_token).execute()
        return

    front_path = None
    selfie_path = None
    
    try:
        logger.info(f"Downloading images for session {session_token}...")
        front_path = download_image(id_front_url, "_front.jpg")
        selfie_path = download_image(selfie_url, "_selfie.jpg")
        
        # 1. Face Match with DeepFace
        logger.info("Running DeepFace...")
        try:
            result = DeepFace.verify(
                img1_path        = str(selfie_path),
                img2_path        = str(front_path),
                model_name       = MODEL_NAME,
                detector_backend = DETECTOR,
                distance_metric  = DISTANCE_METRIC,
                enforce_detection= True, # We want to fail if no face is in either
                silent           = True,
            )
        except ValueError as e:
            msg = str(e).lower()
            if "face could not be detected" in msg or "no face" in msg:
                subject = "ID card" if "img2" in msg else "selfie"
                logger.error(f"No face detected in {subject}.")
                
                # Failed match due to no face
                supabase.table("kyc_sessions").update({
                    "status": "failed",
                    "match": False,
                    "match_score": 0,
                    "match_reason": f"No face detected in the {subject}. Ensure the image is clear and well-lit.",
                    "ocr_result": None
                }).eq("session_token", session_token).execute()
                return
            raise e
        
        distance  = round(result.get("distance", 1.0), 4)
        threshold = result.get("threshold", MATCH_THRESHOLD)
        is_match  = result.get("verified", False)
        match_score = similarity_to_score(distance, threshold)
        
        logger.info(f"DeepFace result: Match={is_match}, Score={match_score}%, Distance={distance}")

        match_reason = (
            f"DeepFace ({MODEL_NAME}) confirmed identity match with {match_score}% similarity (distance: {distance})."
            if is_match else
            f"Face match failed — similarity {match_score}% (distance: {distance}, threshold: ≤{threshold}). "
            "Please retake your selfie in good lighting, facing the camera directly."
        )
        
        # 2. EasyOCR text extraction
        logger.info("Running EasyOCR...")
        ocr_texts = reader.readtext(front_path, detail=0)
        ocr_result_str = " ".join(ocr_texts)
        logger.info(f"OCR extracted {len(ocr_texts)} components.")
        
        ocr_payload = {
            "raw_text": ocr_result_str,
            "components": ocr_texts,
            "engine": "easyocr"
        }
        
        # Determine overall status
        status = "complete" if is_match else "failed"

        # Update Session
        logger.info(f"Finished processing session: {session_token}. Updating database...")
        supabase.table("kyc_sessions").update({
            "status": status,
            "match": is_match,
            "match_score": match_score,
            "match_reason": match_reason,
            "ocr_result": ocr_payload
        }).eq("session_token", session_token).execute()
        
        logger.info(f"Session {session_token} successfully marked as {status}.")
        
    except Exception as e:
        logger.error(f"Error processing session {session_token}: {e}")
        # Mark as failed
        supabase.table("kyc_sessions").update({
            "status": "failed",
            "match_reason": f"System error during processing: {str(e)}"
        }).eq("session_token", session_token).execute()
        
    finally:
        # Cleanup temp files
        if front_path and os.path.exists(front_path):
            os.remove(front_path)
        if selfie_path and os.path.exists(selfie_path):
            os.remove(selfie_path)

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
