# Coach Command Center

FastAPI backend for Coach Command Center (Python 3.11).

## Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and adjust if needed.

## Run

```bash
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000  
Docs: http://127.0.0.1:8000/docs

## Health Check

```bash
curl http://127.0.0.1:8000/health
```

Returns: `{"status":"ok"}`
