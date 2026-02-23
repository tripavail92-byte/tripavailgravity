# ── Stage 1: builder ────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# System deps for OpenCV / image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --target=/app/deps -r requirements.txt

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/deps /app/deps
COPY main.py .

ENV PYTHONPATH=/app/deps
ENV PYTHONUNBUFFERED=1

# Pre-download model weights at build time so first request isn't slow
# DeepFace downloads to ~/.deepface/weights — bake it into the image
RUN PYTHONPATH=/app/deps python -c "\
from deepface import DeepFace; \
import numpy as np; \
img = np.zeros((112,112,3), dtype='uint8'); \
try: DeepFace.represent(img, model_name='Facenet512', enforce_detection=False) \
except Exception: pass; \
print('Facenet512 weights downloaded')"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
