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

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Run once to pre-download models if possible, or just copy the file
COPY . .

CMD ["python", "-u", "worker.py"]
