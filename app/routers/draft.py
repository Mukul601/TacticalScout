"""Draft API routes (uses draft_engine)."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.models import DraftRiskRequest

logger = logging.getLogger("coach_command_center")

router = APIRouter(tags=["draft"])


@router.post("/draft-risk-analysis")
def draft_risk_analysis(body: DraftRiskRequest) -> dict[str, Any]:
    """
    Evaluate a draft (list of champion names) for synergy, damage balance,
    role coverage, and risk alerts. Returns draft_engine evaluation.
    """
    from app.draft_engine import evaluate_draft

    logger.info(
        {
            "endpoint": "/draft-risk-analysis",
            "event": "request",
            "draft_size": len(body.draft),
        }
    )
    try:
        result = evaluate_draft(body.draft)
        logger.info(
            {
                "endpoint": "/draft-risk-analysis",
                "event": "response",
                "risk_alerts": len(result.get("risk_alerts", [])),
            }
        )
        return result
    except Exception as exc:
        logger.exception(
            {
                "endpoint": "/draft-risk-analysis",
                "event": "error",
                "error": str(exc),
            }
        )
        raise HTTPException(
            status_code=500, detail="Internal server error while evaluating draft."
        ) from exc
