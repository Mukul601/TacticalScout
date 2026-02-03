"""Parse raw match data into a clean structured dictionary."""

from typing import Any


def _get_nested(
    data: dict[str, Any],
    *keys: str,
    default: Any = None,
) -> Any:
    """Get value from nested dict using multiple possible key names."""
    if data is None or not isinstance(data, dict):
        return default
    for key in keys:
        if key in data and data[key] is not None:
            return data[key]
    return default


def _edges_nodes(value: Any) -> list[Any]:
    """Extract list from GraphQL-style edges/node or direct list."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        edges = value.get("edges") or value.get("items") or []
        if isinstance(edges, list):
            return [e.get("node", e) if isinstance(e, dict) else e for e in edges]
        return []
    return []


def parse_match_data(raw: dict[str, Any] | None) -> dict[str, Any]:
    """
    Extract match fields from raw API/match payload into a clean structure.

    Handles GraphQL-style (edges/node), camelCase, and snake_case keys.
    Missing or unsupported fields are returned as None or empty lists.

    Args:
        raw: Raw match object (e.g. one match node from GRID or similar API).

    Returns:
        Structured dict with:
          - match_id
          - teams
          - draft_picks
          - player_stats
          - objective_timings
          - kill_participation
          - win_loss
    """
    if not raw or not isinstance(raw, dict):
        return _empty_match_structure()

    # Unwrap GraphQL node if present (single match node from edges)
    if isinstance(raw.get("node"), dict):
        raw = raw["node"]

    match_id = _get_nested(raw, "id", "matchId", "match_id")
    if match_id is None and isinstance(raw.get("match"), dict):
        match_id = raw["match"].get("id") or raw["match"].get("matchId")
    if match_id is None and isinstance(raw.get("match"), list) and raw["match"]:
        first = raw["match"][0]
        if isinstance(first, dict):
            match_id = first.get("id") or first.get("matchId")

    # Teams: contestants, teams, sides
    teams: list[dict[str, Any]] = []
    contestants = _edges_nodes(_get_nested(raw, "contestants", "teams", "teamsList"))
    for c in contestants:
        if not isinstance(c, dict):
            continue
        node_c = c.get("node", c)
        team = node_c.get("team", node_c) if isinstance(node_c, dict) else node_c
        if isinstance(team, dict):
            teams.append({
                "id": team.get("id"),
                "name": team.get("name") or team.get("slug"),
                "side": node_c.get("side") or c.get("side") if isinstance(node_c, dict) else c.get("side"),
                "score": node_c.get("score") or c.get("score") if isinstance(node_c, dict) else c.get("score"),
            })
        else:
            teams.append({"id": c.get("id"), "name": c.get("name"), "side": c.get("side"), "score": c.get("score")})

    if not teams and _get_nested(raw, "teams"):
        t = raw.get("teams") or raw.get("teamList")
        if isinstance(t, list):
            for t_item in t:
                if isinstance(t_item, dict):
                    teams.append({
                        "id": t_item.get("id"),
                        "name": t_item.get("name") or t_item.get("teamName"),
                        "side": t_item.get("side"),
                        "score": t_item.get("score"),
                    })

    # Draft picks
    draft_picks: list[dict[str, Any]] = []
    drafts = _get_nested(raw, "draft", "draftPicks", "draft_picks", "picks")
    if isinstance(drafts, dict):
        drafts = drafts.get("picks") or drafts.get("selections") or _edges_nodes(drafts.get("edges"))
    for item in _edges_nodes(drafts) if drafts is not None else []:
        if not isinstance(item, dict):
            continue
        node_item = item.get("node", item)
        draft_picks.append({
            "pick_order": node_item.get("order") or node_item.get("pickOrder") or item.get("order"),
            "team_id": node_item.get("teamId") or node_item.get("team_id") or item.get("teamId"),
            "selection": node_item.get("selection") or node_item.get("hero") or node_item.get("champion") or item.get("selection"),
            "phase": node_item.get("phase") or item.get("phase"),
        })

    # Player stats
    player_stats: list[dict[str, Any]] = []
    members_source = _get_nested(raw, "playerStats", "player_stats", "players", "members", "rosters")
    for m in _edges_nodes(members_source) if members_source is not None else []:
        if not isinstance(m, dict):
            continue
        node_m = m.get("node", m)
        player = node_m.get("player", node_m) if isinstance(node_m, dict) else node_m
        if isinstance(player, dict):
            stats = node_m if isinstance(node_m, dict) else m
            player_stats.append({
                "player_id": player.get("id"),
                "player_name": player.get("name") or player.get("nickname"),
                "team_id": stats.get("teamId") or stats.get("team_id") or player.get("teamId"),
                "kills": stats.get("kills") or stats.get("k"),
                "deaths": stats.get("deaths") or stats.get("d"),
                "assists": stats.get("assists") or stats.get("a"),
                "damage": stats.get("damage") or stats.get("damageDealt"),
                "gold": stats.get("gold") or stats.get("goldEarned"),
                "cs": stats.get("cs") or stats.get("creepScore") or stats.get("minionsKilled"),
            })

    # Objective timings (turrets, dragons, baron, etc.)
    objective_timings: list[dict[str, Any]] = []
    objs = _get_nested(raw, "objectives", "objectiveTimings", "objective_timings", "events")
    for o in _edges_nodes(objs) if objs is not None else []:
        if not isinstance(o, dict):
            continue
        node_o = o.get("node", o)
        objective_timings.append({
            "type": node_o.get("type") or node_o.get("objectiveType") or o.get("type"),
            "time_seconds": node_o.get("time") or node_o.get("timeSeconds") or node_o.get("timestamp") or o.get("time"),
            "team_id": node_o.get("teamId") or node_o.get("team_id") or o.get("teamId"),
            "position": node_o.get("position") or o.get("position"),
        })

    # Kill participation (per player or per team)
    kill_participation: dict[str, Any] = {}
    kp = _get_nested(raw, "killParticipation", "kill_participation", "kp")
    if isinstance(kp, dict):
        kill_participation = {str(k): v for k, v in kp.items()}
    elif isinstance(kp, list):
        for item in kp:
            if isinstance(item, dict):
                pid = item.get("playerId") or item.get("player_id") or item.get("id")
                if pid is not None:
                    kill_participation[str(pid)] = item.get("percentage") or item.get("kp") or item.get("value")

    # Win/Loss
    win_loss: dict[str, Any] = {"winner": None, "loser": None, "winner_side": None, "result": None}
    winner = _get_nested(raw, "winner", "winnerId", "winner_id")
    loser = _get_nested(raw, "loser", "loserId", "loser_id")
    result = _get_nested(raw, "result", "outcome", "status")
    if result and isinstance(result, dict):
        winner = result.get("winner") or result.get("winnerId")
        loser = result.get("loser") or result.get("loserId")
    for c in contestants:
        if not isinstance(c, dict) or win_loss["winner"] is not None:
            continue
        node_c = c.get("node", c)
        res = node_c.get("result") or node_c.get("outcome")
        if res in ("win", "won", "victory", 1, "1"):
            team_ref = node_c.get("teamId") or node_c.get("team")
            win_loss["winner"] = team_ref.get("id") if isinstance(team_ref, dict) else team_ref
            win_loss["winner_side"] = node_c.get("side")
        elif res in ("loss", "lost", "defeat", 0, "0"):
            team_ref = node_c.get("teamId") or node_c.get("team")
            win_loss["loser"] = team_ref.get("id") if isinstance(team_ref, dict) else team_ref
    if winner is not None:
        win_loss["winner"] = winner
    if loser is not None:
        win_loss["loser"] = loser
    if result is not None and not isinstance(result, dict):
        win_loss["result"] = result

    return {
        "match_id": match_id,
        "teams": teams,
        "draft_picks": draft_picks,
        "player_stats": player_stats,
        "objective_timings": objective_timings,
        "kill_participation": kill_participation,
        "win_loss": win_loss,
    }


def _empty_match_structure() -> dict[str, Any]:
    """Return empty structure when input is missing."""
    return {
        "match_id": None,
        "teams": [],
        "draft_picks": [],
        "player_stats": [],
        "objective_timings": [],
        "kill_participation": {},
        "win_loss": {"winner": None, "loser": None, "winner_side": None, "result": None},
    }
