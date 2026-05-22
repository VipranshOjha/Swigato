FROM python:3.12-slim

# ─── System deps ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# ─── Working directory ───────────────────────────────────────────────────────
WORKDIR /app

# ─── Python dependencies ─────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── App code ────────────────────────────────────────────────────────────────
COPY . .

# ─── Non-root user for security ──────────────────────────────────────────────
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
