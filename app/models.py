"""Pydantic models for Coach Command Center."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response model for the health check endpoint."""

    status: str = "ok"


class ScoutingReportRequest(BaseModel):
    """Request body for POST /generate-scouting-report."""

    team_name: str = Field(..., min_length=1, description="Team name to search for in GRID.")
    match_limit: int = Field(..., ge=1, le=50, description="Max number of matches/series to fetch and analyze.")


class DraftRiskRequest(BaseModel):
    """Request body for POST /draft-risk-analysis."""

    draft: list[str] = Field(..., description="List of champion names to evaluate.")


class CoachChatRequest(BaseModel):
    """Request body for POST /coach-chat."""

    question: str = Field(..., min_length=1, description="User question for the coach AI.")
    scouting_report: dict = Field(default_factory=dict, description="Scouting report object for context.")
