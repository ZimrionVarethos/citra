# =============================================================================
# Production Dockerfile for KK-SCANNER PRO Backend (Render Web Service)
# Lightweight, Memory-Optimized (Fits 512 MB RAM Render Free Tier)
# =============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies: Tesseract OCR + Indonesian language pack
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        tesseract-ocr \
        tesseract-ocr-ind \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . /app

# Expose default port (Render will inject PORT env var at runtime)
EXPOSE 5000

# Run with Gunicorn: 1 worker (crucial for 512MB RAM free tier) and 120s timeout (for OCR processing)
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 2 --timeout 120 app:app"]
