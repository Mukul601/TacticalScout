"""Coach Command Center - FastAPI application entry point."""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config  # noqa: F401 - load .env on startup
from app.models import HealthResponse
from app.routers import scouting_router, draft_router, chat_router

logger = logging.getLogger("coach_command_center")

app = FastAPI(
    title="Coach Command Center",
    description="Backend API for Coach Command Center",
    version="0.1.0",
)

# CORS: localhost for dev + CORS_ORIGINS from env for production (e.g. Vercel URL)
_local_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3004",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]
_extra_origins = [o.strip() for o in (config.CORS_ORIGINS_EXTRA or "").split(",") if o.strip()]
allow_origins = _local_origins + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (endpoints moved from main into router modules)
app.include_router(scouting_router)  # POST /generate-scouting-report
app.include_router(draft_router)     # POST /draft-risk-analysis
app.include_router(chat_router)      # POST /coach-chat


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    logger.info({"endpoint": "/health", "event": "request"})
    try:
        resp = HealthResponse(status="ok")
        logger.info({"endpoint": "/health", "event": "response", "status": resp.status})
        return resp
    except Exception as exc:  # pragma: no cover - extremely unlikely
        logger.exception({"endpoint": "/health", "event": "error", "error": str(exc)})
        raise HTTPException(status_code=500, detail="Internal server error in health check.") from exc
