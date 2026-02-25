import os
import sys

# Add the parent directory to sys.path so we can import worker
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

# Force load the root .env file so we get the Supabase keys
root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env')
load_dotenv(root_env)

import worker

def test_face_match():
    print("starting test...")
    # These are two images of the same person from the deepface test dataset
    mock_session = {
        "session_token": "TEST_MOCK_TOKEN_123",
        "user_id": "test_user_id",
        "id_front_url": "https://raw.githubusercontent.com/serengil/deepface/master/tests/dataset/img1.jpg",
        "selfie_url": "https://raw.githubusercontent.com/serengil/deepface/master/tests/dataset/img2.jpg"
    }
    
    # process_session will download them, run deepface, run easyocr, and then try to update supabase
    # since no row has session_token 'TEST_MOCK_TOKEN_123', the update is harmless.
    print(f"Mocking session with ID image: {mock_session['id_front_url']}")
    worker.process_session(mock_session)
    print("Test completed. Check the worker logs above to verify match and text extraction.")

if __name__ == "__main__":
    test_face_match()
