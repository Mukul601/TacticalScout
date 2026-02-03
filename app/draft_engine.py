"""Draft engine module for Coach Command Center.

Provides evaluation utilities for champion drafts / lineups.

The main entrypoint is `evaluate_draft(draft_list)`, which accepts a list of
champion picks and returns:

    - Synergy score
    - Damage composition balance
    - Role coverage validation
    - Risk alerts

Champion metadata includes:
    - Role mapping (default_role)
    - Damage type mapping (physical | magic | mixed | true)
    - Synergy tags (engage, teamfight, pick, aoe, scaling, etc.)
    - Frontline / carry tagging (tank, frontline, hyper_carry, carry, dps)
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List


# --- Champion metadata: role, damage type, synergy tags, frontline/carry ------

@dataclass(frozen=True)
class ChampionMeta:
    default_role: str | None
    damage_type: str | None  # "physical" | "magic" | "mixed" | "true"
    tags: List[str]  # synergy + frontline/carry: tank, frontline, carry, hyper_carry, dps, engage, teamfight, pick, aoe, scaling, poke


def _load_champion_metadata() -> Dict[str, ChampionMeta]:
    """Load champion metadata from app/data/champions.json. Falls back to minimal dict on error."""
    try:
        path = Path(__file__).resolve().parent / "data" / "champions.json"
        if not path.exists():
            return _fallback_champion_metadata()
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        champions = data.get("champions", data) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        result: Dict[str, ChampionMeta] = {}
        for entry in champions:
            if not isinstance(entry, dict):
                continue
            name = (entry.get("name") or "").strip()
            if not name:
                continue
            key = name.lower()
            role = (entry.get("role") or "").strip().lower() or None
            damage_type = (entry.get("damage_type") or "").strip().lower() or None
            tags_raw = entry.get("tags")
            tags = [str(t).strip().lower() for t in (tags_raw if isinstance(tags_raw, list) else []) if t]
            result[key] = ChampionMeta(default_role=role, damage_type=damage_type, tags=tags)
        return result if result else _fallback_champion_metadata()
    except Exception:
        return _fallback_champion_metadata()


def _fallback_champion_metadata() -> Dict[str, ChampionMeta]:
    """Minimal metadata when JSON is missing or invalid."""
    return {
        "ahri": ChampionMeta("mid", "magic", ["pick", "burst", "mobility"]),
        "amumu": ChampionMeta("jungle", "magic", ["tank", "frontline", "engage", "teamfight"]),
        "vayne": ChampionMeta("adc", "physical", ["hyper_carry", "scaling", "dps"]),
        "thresh": ChampionMeta("support", "magic", ["frontline", "engage", "pick", "utility"]),
    }


CHAMPION_METADATA: Dict[str, ChampionMeta] = _load_champion_metadata()

REQUIRED_ROLES = ["top", "jungle", "mid", "adc", "support"]

# Default role by pick order when champion is unknown (1–5)
DEFAULT_ROLE_BY_INDEX = ["top", "jungle", "mid", "adc", "support"]


def _normalize_pick(pick: Any) -> Dict[str, Any]:
    """Normalize a draft pick (string or dict) into a standard dict."""
    if isinstance(pick, str):
        champ_name = pick
        role = None
        dmg_type = None
        tags: List[str] = []
    elif isinstance(pick, dict):
        champ_name = pick.get("champion") or pick.get("name") or pick.get("id") or ""
        role = (pick.get("role") or "").lower() or None
        dmg_type = (pick.get("damage_type") or "").lower() or None
        tags = [str(t).lower() for t in (pick.get("tags") or []) if t]
    else:
        champ_name = str(pick)
        role = None
        dmg_type = None
        tags = []

    champ_key = str(champ_name).strip()
    meta = CHAMPION_METADATA.get(champ_key.lower())

    if meta:
        if role is None and meta.default_role:
            role = meta.default_role
        if dmg_type is None and meta.damage_type:
            dmg_type = meta.damage_type
        for t in meta.tags:
            lt = t.lower()
            if lt not in tags:
                tags.append(lt)

    return {
        "champion": champ_key,
        "role": role,
        "damage_type": dmg_type,
        "tags": tags,
    }


def _apply_fallback_for_unknowns(picks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fill role, damage_type, and tags for picks that have none (unknown champions).
    Ensures non-zero synergy, role coverage, and damage composition scores.
    """
    result: List[Dict[str, Any]] = []
    for i, p in enumerate(picks):
        out = dict(p)
        role = (out.get("role") or "").strip()
        dmg_type = (out.get("damage_type") or "").strip()
        tags = list(out.get("tags") or [])

        idx = i % len(DEFAULT_ROLE_BY_INDEX)
        if not role:
            out["role"] = DEFAULT_ROLE_BY_INDEX[idx]
            role = out["role"]
        if not dmg_type:
            out["damage_type"] = "mixed"
            dmg_type = "mixed"
        if not tags:
            if role in ("top", "jungle"):
                out["tags"] = ["frontline", "engage"]
            else:
                out["tags"] = ["carry", "dps"]
        result.append(out)
    return result


def _synergy_score(picks: List[Dict[str, Any]], roles: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Compute synergy score from shared tags, frontline/carry balance, and role coverage."""
    if not picks:
        return {"score": 0.0, "classification": "unknown", "details": {}}

    tag_counts: Dict[str, int] = {}
    for p in picks:
        for t in p.get("tags") or []:
            tag_counts[t] = tag_counts.get(t, 0) + 1

    # Base score for having a full comp (5 roles) – ensures non-zero when draft is filled
    role_score = 0.0
    if roles and roles.get("status") == "complete":
        role_score = 25.0
    elif roles and not roles.get("missing_roles"):
        role_score = 15.0

    # Frontline + carry balance (core comp synergy)
    has_frontline = any(t in p.get("tags", []) for p in picks for t in ("tank", "frontline"))
    has_carry = any(t in p.get("tags", []) for p in picks for t in ("hyper_carry", "carry", "dps"))
    core_score = 25.0 if (has_frontline and has_carry) else (10.0 if (has_frontline or has_carry) else 0.0)

    # Shared synergy tags (engage, teamfight, pick, aoe, scaling)
    shared_tags = ["engage", "teamfight", "pick", "aoe", "scaling"]
    shared_score = 0.0
    for t in shared_tags:
        c = tag_counts.get(t, 0)
        if c >= 2:
            shared_score += min(15.0, 4.0 * (c - 1))
        elif c == 1:
            shared_score += 2.0

    raw_score = min(100.0, role_score + core_score + shared_score)
    if raw_score >= 70:
        label = "high"
    elif raw_score >= 40:
        label = "medium"
    else:
        label = "low"

    return {
        "score": round(raw_score, 2),
        "classification": label,
        "details": {
            "tag_counts": tag_counts,
            "has_frontline": has_frontline,
            "has_carry": has_carry,
        },
    }


def _damage_balance(picks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Evaluate physical vs magic damage mix and return a balance score."""
    counts = {"physical": 0, "magic": 0, "mixed": 0, "true": 0, "unknown": 0}
    for p in picks:
        dt = (p.get("damage_type") or "").lower()
        if dt in ("physical", "ad"):
            counts["physical"] += 1
        elif dt in ("magic", "ap"):
            counts["magic"] += 1
        elif dt in ("mixed",):
            counts["mixed"] += 1
        elif dt in ("true",):
            counts["true"] += 1
        else:
            counts["unknown"] += 1

    total_known = counts["physical"] + counts["magic"] + counts["mixed"]
    if total_known == 0:
        return {
            "score": 0.0,
            "classification": "unknown",
            "details": counts,
        }

    # Ideal: mix of physical and magic, optionally some mixed.
    phys_ratio = counts["physical"] / total_known
    magic_ratio = counts["magic"] / total_known
    # Penalty for extreme skew
    skew = abs(phys_ratio - magic_ratio)
    score = max(0.0, 100.0 * (1.0 - skew))

    if score >= 70:
        label = "balanced"
    elif score >= 40:
        label = "leaning"
    else:
        label = "one_dimensional"

    return {
        "score": round(score, 2),
        "classification": label,
        "details": counts,
    }


def _role_coverage(picks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Check whether standard roles are covered."""
    roles_present = {r: 0 for r in REQUIRED_ROLES}
    for p in picks:
        r = (p.get("role") or "").lower()
        if r in roles_present:
            roles_present[r] += 1

    missing = [r for r, c in roles_present.items() if c == 0]
    duplicates = [r for r, c in roles_present.items() if c > 1]

    if not missing and not duplicates:
        status = "complete"
    elif not missing and duplicates:
        status = "overlapping"
    else:
        status = "incomplete"

    return {
        "status": status,
        "missing_roles": missing,
        "duplicate_roles": duplicates,
        "roles_present": roles_present,
    }


def _risk_alerts(
    picks: List[Dict[str, Any]],
    synergy: Dict[str, Any],
    damage: Dict[str, Any],
    roles: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Generate textual risk alerts based on composition issues."""
    alerts: List[Dict[str, Any]] = []

    # Damage one-dimensional
    if damage.get("classification") == "one_dimensional":
        dominant = "physical" if damage["details"]["physical"] > damage["details"]["magic"] else "magic"
        alerts.append({
            "severity": "high",
            "type": "damage_profile",
            "message": f"Draft is heavily skewed towards {dominant} damage; easily itemized against.",
        })

    # Missing core roles
    if roles.get("status") == "incomplete":
        if "jungle" in roles.get("missing_roles", []):
            alerts.append({
                "severity": "high",
                "type": "role_gap",
                "message": "No dedicated jungler detected; early objective and map control may be weak.",
            })
        if "frontline" in (synergy.get("details") or {}).get("tag_counts", {}):
            # already counted via tags
            pass
        if not synergy.get("details", {}).get("has_frontline"):
            alerts.append({
                "severity": "medium",
                "type": "frontline",
                "message": "Draft lacks clear frontline/tank presence; hard to start or absorb fights.",
            })

    # Low synergy
    if synergy.get("classification") == "low":
        alerts.append({
            "severity": "medium",
            "type": "synergy",
            "message": "Low inferred synergy between picks; game plan may be unclear or disjointed.",
        })

    # Many scaling picks -> late-game risk
    scaling_count = synergy.get("details", {}).get("tag_counts", {}).get("scaling", 0)
    if scaling_count >= 3:
        alerts.append({
            "severity": "info",
            "type": "scaling",
            "message": "Heavy reliance on scaling champions; early game may be fragile.",
        })

    return alerts


def evaluate_draft(draft_list: List[Any]) -> Dict[str, Any]:
    """Evaluate a draft for synergy, damage balance, roles, and risks.

    Args:
        draft_list: List of champion picks (strings or dicts).

    Returns:
        {
          "synergy": {...},
          "damage_composition": {...},
          "role_coverage": {...},
          "risk_alerts": [ { "severity", "type", "message" }, ... ],
          "picks": [normalized_picks...],
        }
    """
    raw_picks = [_normalize_pick(p) for p in draft_list or []]
    picks = _apply_fallback_for_unknowns(raw_picks)

    roles = _role_coverage(picks)
    synergy = _synergy_score(picks, roles)
    damage = _damage_balance(picks)
    alerts = _risk_alerts(picks, synergy, damage, roles)

    return {
        "synergy": synergy,
        "damage_composition": damage,
        "role_coverage": roles,
        "risk_alerts": alerts,
        "picks": picks,
    }

