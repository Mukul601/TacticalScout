"""Chat API routes (uses chat_engine)."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.models import CoachChatRequest

logger = logging.getLogger("coach_command_center")

router = APIRouter(tags=["chat"])


@router.post("/coach-chat")
def coach_chat(body: CoachChatRequest) -> dict[str, Any]:
    """
    Send a question and scouting report to the coach AI. Returns AI-generated
    response based on the scouting data (OpenAI or Gemini).
    """
    from app.chat_engine import generate_chat_response

    logger.info(
        {
            "endpoint": "/coach-chat",
            "event": "request",
            "question_preview": body.question[:80],
        }
    )
    try:
        result = generate_chat_response(body.question, body.scouting_report)
        logger.info(
            {
                "endpoint": "/coach-chat",
                "event": "response",
                "provider": result.get("provider"),
                "has_error": bool(result.get("error")),
            }
        )
        return result
    except Exception as exc:
        logger.exception(
            {
                "endpoint": "/coach-chat",
                "event": "error",
                "error": str(exc),
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating coach chat response.",
        ) from exc
