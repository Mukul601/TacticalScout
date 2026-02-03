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

## Deploy: Vercel (frontend) + AWS (backend)

**Frontend (Vercel)**  
- In Vercel, set **Root Directory** to `Frontend`.  
- Add env var: `VITE_API_URL` = your backend URL (e.g. `https://your-api.execute-api.region.amazonaws.com` or your EC2/Elastic Beanstalk URL).  
- Build uses Vite; SPA rewrites are in `Frontend/vercel.json`.

**Backend (AWS)**  
- **EC2 / Elastic Beanstalk / ECS:** Run `uvicorn app.main:app --host 0.0.0.0 --port 8000`. No extra deps.  
- **Lambda + API Gateway:** Use handler `app.lambda_handler.handler` (Mangum). Package `app/` and dependencies; set `CORS_ORIGINS` to your Vercel URL (e.g. `https://your-app.vercel.app`).  
- Set `CORS_ORIGINS` (comma-separated) to your frontend origin(s) so the browser allows requests.
