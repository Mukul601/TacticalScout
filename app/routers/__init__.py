"""API route modules for Coach Command Center."""

from app.routers.scouting import router as scouting_router
from app.routers.draft import router as draft_router
from app.routers.chat import router as chat_router

__all__ = ["scouting_router", "draft_router", "chat_router"]
