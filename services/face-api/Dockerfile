# Use the official prebuilt DeepFace image — no TF install, no build time
FROM serengil/deepface:latest

WORKDIR /app

# Install only our extra deps (FastAPI, httpx) — everything else is already in the base image
RUN pip install --no-cache-dir fastapi==0.115.6 "uvicorn[standard]==0.32.1" httpx==0.28.1 python-multipart==0.0.20

COPY main.py preload_models.py ./

ENV PYTHONUNBUFFERED=1

# Pre-download model + detector weights into the image layer
RUN python preload_models.py

EXPOSE 8000

# Reset the base image entrypoint (serengil/deepface uses entrypoint.sh for gunicorn)
ENTRYPOINT []

# Bind to Railway-provided $PORT (fallback to 8000 for local runs)
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
