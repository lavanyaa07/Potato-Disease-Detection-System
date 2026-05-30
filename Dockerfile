# ── AgriVision AI – Backend Dockerfile ────────────────────────────────────────
# Uses Python 3.10-slim for TF 2.13 compatibility

FROM python:3.10-slim

# Metadata
LABEL maintainer="AgriVision AI"
LABEL description="Potato Disease Detection API – FastAPI + TensorFlow 2.13"

# Prevent interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install OS-level deps needed by Pillow / TF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies first (layer caching)
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the model file
COPY potatoes.h5 ./potatoes.h5

# Copy the API source
COPY api/main.py ./main.py

# Expose the port Render will use (also overridable via PORT env var)
EXPOSE 8000

# Health check for Render
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Start the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
