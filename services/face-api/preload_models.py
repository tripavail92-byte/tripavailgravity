"""Pre-download FaceNet-512 model weights so first API request is fast."""
from deepface import DeepFace
import numpy as np

img = np.zeros((112, 112, 3), dtype='uint8')
try:
    DeepFace.represent(img, model_name='Facenet512', enforce_detection=False)
    print('✓ Facenet512 weights downloaded')
except Exception as e:
    print(f'Warning during preload: {e}')
    print('Weights will be downloaded on first request')
