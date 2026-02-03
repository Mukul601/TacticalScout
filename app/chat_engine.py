"""Chat engine: AI explanations based on scouting data using OpenAI or Gemini."""

import json
import os
from typing import Any

import requests


OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def _get_provider_and_key() -> tuple[str | None, str | None]:
    """Return (provider, api_key) from env. Prefer OPENAI if both set."""
    provider = (os.environ.get("CHAT_PROVIDER") or "").lower().strip()
    openai_key = os.environ.get("OPENAI_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if provider == "gemini" and gemini_key:
        return "gemini", gemini_key
    if provider == "openai" and openai_key:
        return "openai", openai_key
    if openai_key:
        return "openai", openai_key
    if gemini_key:
        return "gemini", gemini_key
    return None, None


def _call_openai(api_key: str, system_content: str, user_content: str) -> str:
    """Call OpenAI Chat Completions and return assistant message text."""
    payload = {
        "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": 1024,
        "temperature": 0.3,
    }
    resp = requests.post(
        OPENAI_CHAT_URL,
        json=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    choice = (data.get("choices") or [None])[0]
    if not choice:
        raise ValueError("OpenAI response had no choices")
    msg = choice.get("message") or {}
    return (msg.get("content") or "").strip()


def _call_gemini(api_key: str, system_content: str, user_content: str) -> str:
    """Call Gemini generateContent and return text."""
    model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    url = f"{GEMINI_BASE_URL}/{model}:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {"parts": [{"text": system_content}]},
        "contents": [{"role": "user", "parts": [{"text": user_content}]}],
        "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.3},
    }
    resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    cands = (data.get("candidates") or [None])[0]
    if not cands:
        raise ValueError("Gemini response had no candidates")
    parts = cands.get("content", {}).get("parts") or []
    if not parts:
        return ""
    return (parts[0].get("text") or "").strip()


def generate_chat_response(user_question: str, scouting_report_json: dict[str, Any] | None) -> dict[str, Any]:
    """
    Generate an AI explanation based on the user's question and scouting report data.

    Uses OpenAI (OPENAI_API_KEY) or Gemini (GEMINI_API_KEY). Set CHAT_PROVIDER
    to "openai" or "gemini" to force one; otherwise OpenAI is preferred if both keys exist.

    Args:
        user_question: The user's question (e.g. "What are our main weaknesses?").
        scouting_report_json: Scouting report dict (e.g. from POST /generate-scouting-report).

    Returns:
        {
          "response": str,       # AI explanation text
          "provider": str,      # "openai" | "gemini"
          "error": str | None,  # If call failed, error message; else None
        }
    """
    provider, api_key = _get_provider_and_key()
    if not provider or not api_key:
        return {
            "response": "",
            "provider": "",
            "error": "No chat API key set. Set OPENAI_API_KEY or GEMINI_API_KEY in .env",
        }

    report_str = json.dumps(scouting_report_json or {}, indent=2)
    system_content = (
        "You are a coach assistant for esports. Use ONLY the provided scouting report JSON to answer. "
        "Be concise and specific. If the report does not contain relevant data, say so."
    )
    user_content = f"Scouting report:\n{report_str}\n\nQuestion: {user_question}"

    try:
        if provider == "openai":
            text = _call_openai(api_key, system_content, user_content)
        else:
            text = _call_gemini(api_key, system_content, user_content)
        return {"response": text, "provider": provider, "error": None}
    except requests.RequestException as e:
        return {"response": "", "provider": provider, "error": f"API request failed: {e!s}"}
    except (ValueError, KeyError) as e:
        return {"response": "", "provider": provider, "error": f"API response error: {e!s}"}
