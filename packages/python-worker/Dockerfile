FROM python:3.10-slim

# Install system dependencies required by OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Use uv for ultra-fast dependency resolution (fixes pip hanging on ML libraries)
RUN pip install --no-cache-dir uv

COPY requirements.txt .

RUN uv pip install --system --no-cache -r requirements.txt

# Run once to pre-download models if possible, or just copy the file
COPY . .

CMD ["python", "-u", "worker.py"]
