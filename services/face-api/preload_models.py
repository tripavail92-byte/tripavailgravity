"""Pre-download DeepFace model + detector weights so cold starts are faster."""

import os

import numpy as np
from deepface import DeepFace


MODEL_NAME = os.getenv("DEEPFACE_MODEL", "Facenet512")
DETECTOR = os.getenv("DEEPFACE_DETECTOR", "retinaface")


def main() -> None:
    img = np.zeros((224, 224, 3), dtype="uint8")

    try:
        DeepFace.represent(img, model_name=MODEL_NAME, enforce_detection=False)
        print(f"✓ {MODEL_NAME} weights downloaded")
    except Exception as e:
        print(f"Warning during model preload: {e}")
        print("Model weights may be downloaded on first request")

    # Trigger detector backend download/build (e.g., retinaface.h5)
    try:
        DeepFace.verify(
            img1_path=img,
            img2_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=False,
            silent=True,
        )
        print(f"✓ {DETECTOR} detector initialized")
    except Exception as e:
        print(f"Warning during detector preload: {e}")
        print("Detector weights may be downloaded on first request")


if __name__ == "__main__":
    main()
