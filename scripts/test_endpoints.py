#!/usr/bin/env python3
"""
Example test script using requests to call all Coach Command Center API endpoints.

Usage:
    python scripts/test_endpoints.py [BASE_URL]

    BASE_URL defaults to http://127.0.0.1:8000

Ensure the API server is running with the latest code, e.g.:
    uvicorn app.main:app --reload

Endpoints exercised:
    GET  /health
    POST /generate-scouting-report  (team_name, match_limit)
    POST /draft-risk-analysis       (draft: list of champion names)
    POST /coach-chat                (question, scouting_report)
    POST /coach-chat with invalid body (expect 422)
"""

import json
import sys
from typing import Any

import requests


def main(base_url: str = "http://127.0.0.1:8000") -> int:
    base_url = base_url.rstrip("/")
    session = requests.Session()
    session.headers["Content-Type"] = "application/json"

    def get(path: str, **kwargs: Any) -> requests.Response:
        return session.get(f"{base_url}{path}", timeout=30, **kwargs)

    def post(path: str, json_data: dict[str, Any] | None = None, **kwargs: Any) -> requests.Response:
        return session.post(f"{base_url}{path}", json=json_data or {}, timeout=60, **kwargs)

    errors: list[str] = []
    scouting_report: dict[str, Any] | None = None

    # --- GET /health ---
    print("GET /health ...")
    try:
        r = get("/health")
        r.raise_for_status()
        data = r.json()
        assert data.get("status") == "ok", data
        print(f"  OK {r.status_code} {data}")
    except Exception as e:
        errors.append(f"GET /health: {e}")
        print(f"  FAIL: {e}")

    # --- POST /generate-scouting-report ---
    print("POST /generate-scouting-report ...")
    try:
        r = post("/generate-scouting-report", json_data={"team_name": "G2", "match_limit": 2})
        r.raise_for_status()
        scouting_report = r.json()
        assert "matches_analyzed" in scouting_report
        assert "team_strategy" in scouting_report
        assert "counter_strategies" in scouting_report
        print(f"  OK {r.status_code} matches_analyzed={scouting_report.get('matches_analyzed')}")
    except requests.HTTPError as e:
        errors.append(f"POST /generate-scouting-report: {e.response.status_code} {e.response.text[:200]}")
        print(f"  FAIL: {e}")
    except Exception as e:
        errors.append(f"POST /generate-scouting-report: {e}")
        print(f"  FAIL: {e}")

    # --- POST /draft-risk-analysis ---
    print("POST /draft-risk-analysis ...")
    try:
        r = post(
            "/draft-risk-analysis",
            json_data={"draft": ["Ahri", "Amumu", "Kayle", "Vayne", "Thresh"]},
        )
        r.raise_for_status()
        data = r.json()
        assert "synergy" in data and "damage_composition" in data
        assert "role_coverage" in data and "risk_alerts" in data
        print(f"  OK {r.status_code} synergy={data.get('synergy', {}).get('classification')} risk_alerts={len(data.get('risk_alerts', []))}")
    except Exception as e:
        errors.append(f"POST /draft-risk-analysis: {e}")
        print(f"  FAIL: {e}")

    # --- POST /coach-chat ---
    print("POST /coach-chat ...")
    try:
        r = post(
            "/coach-chat",
            json_data={
                "question": "What should we focus on against this team?",
                "scouting_report": scouting_report or {},
            },
        )
        r.raise_for_status()
        data = r.json()
        assert "response" in data and "provider" in data and "error" in data
        err = data.get("error")
        if err:
            print(f"  OK {r.status_code} (chat API not configured: {err[:60]}...)")
        else:
            print(f"  OK {r.status_code} provider={data.get('provider')} response_len={len(data.get('response', ''))}")
    except Exception as e:
        errors.append(f"POST /coach-chat: {e}")
        print(f"  FAIL: {e}")

    # --- Validation: expect 422 for invalid input ---
    print("POST /coach-chat (validation: empty question) ...")
    try:
        r = post("/coach-chat", json_data={"question": "", "scouting_report": {}})
        assert r.status_code == 422, f"expected 422 got {r.status_code}"
        print(f"  OK {r.status_code} (validation works)")
    except Exception as e:
        errors.append(f"POST /coach-chat validation: {e}")
        print(f"  FAIL: {e}")

    # --- Summary ---
    print()
    if errors:
        print("FAILED:", len(errors), "error(s)")
        for err in errors:
            print("  -", err)
        return 1
    print("All endpoints OK.")
    return 0


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
    sys.exit(main(base))
