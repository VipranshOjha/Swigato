# Swigato Deployment Guide

## Prerequisites
- Python 3.10+
- PostgreSQL
- Redis
- Node.js (for frontend optional bundling)

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Celery Workers
```bash
celery -A app.infrastructure.celery_app worker --loglevel=info
```
