"""Scouting API routes (uses scouting_engine)."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException

from app.models import ScoutingReportRequest

logger = logging.getLogger("coach_command_center")

router = APIRouter(tags=["scouting"])


@router.post("/generate-scouting-report")
def generate_scouting_report(body: ScoutingReportRequest) -> dict[str, Any]:
    """
    Generate a combined scouting report for a team.

    Fetches matches from GRID, parses them, runs scouting engines (team strategy,
    player tendencies, team compositions), and counter strategy engine.
    Returns combined JSON report.
    """
    from app.grid_client import fetch_team_matches
    from app.match_parser import parse_match_data
    from app.scouting_engine import (
        analyze_team_compositions,
        analyze_player_tendencies,
        analyze_team_strategy,
        generate_counter_strategies,
    )

    logger.info(
        {
            "endpoint": "/generate-scouting-report",
            "event": "request",
            "team_name": body.team_name,
            "match_limit": body.match_limit,
        }
    )

    try:
        try:
            raw = fetch_team_matches(body.team_name, body.match_limit)
        except ValueError as e:
            logger.warning(
                {
                    "endpoint": "/generate-scouting-report",
                    "event": "upstream_error",
                    "error": str(e),
                }
            )
            raise HTTPException(status_code=503, detail=str(e)) from e
        except Exception as e:
            logger.exception(
                {
                    "endpoint": "/generate-scouting-report",
                    "event": "upstream_error",
                    "error": str(e),
                }
            )
            raise HTTPException(status_code=502, detail="GRID request failed.") from e

        team_info = raw.get("team")
        edges = (raw.get("data") or {}).get("allSeries", {}).get("edges", [])
        match_data_list: list[dict[str, Any]] = []
        for edge in edges:
            node = edge.get("node") if isinstance(edge, dict) else None
            if node:
                parsed = parse_match_data({"node": node})
                match_data_list.append(parsed)

        # If GRID returned zero matches, fall back to sample mock data so scouting still produces output
        mock_data_used = False
        if len(match_data_list) == 0:
            from app.mock_data import get_mock_match_data
            match_data_list = get_mock_match_data(body.team_name, num_matches=min(5, body.match_limit))
            if not team_info:
                team_info = {"id": "mock", "name": body.team_name}
            mock_data_used = True
            logger.info(
                {
                    "endpoint": "/generate-scouting-report",
                    "event": "mock_data_fallback",
                    "team_name": body.team_name,
                    "mock_matches": len(match_data_list),
                }
            )

        team_strategy = analyze_team_strategy(match_data_list)
        player_tendencies = analyze_player_tendencies(match_data_list)
        team_compositions = analyze_team_compositions(match_data_list)
        combined_analysis = {
            "team_strategy": team_strategy,
            "player_tendencies": player_tendencies,
            "team_compositions": team_compositions,
        }
        counter_strategies = generate_counter_strategies(combined_analysis)

        response = {
            "team": team_info,
            "matches_analyzed": len(match_data_list),
            "mock_data_used": mock_data_used,
            "team_strategy": team_strategy,
            "player_tendencies": player_tendencies,
            "team_compositions": team_compositions,
            "counter_strategies": counter_strategies,
        }
        logger.info(
            {
                "endpoint": "/generate-scouting-report",
                "event": "response",
                "matches_analyzed": response["matches_analyzed"],
            }
        )
        return response
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            {
                "endpoint": "/generate-scouting-report",
                "event": "error",
                "error": str(exc),
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error while generating scouting report.",
        ) from exc
