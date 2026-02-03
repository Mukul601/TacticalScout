"""Scouting engine: team strategy analysis from match data."""

import math
from typing import Any


# Time threshold for "early" phase (15 minutes in seconds)
EARLY_PHASE_SECONDS = 900

# Classification thresholds
EARLY_AGGRESSION_HIGH = 60
EARLY_AGGRESSION_MEDIUM = 30
OBJECTIVE_CONTEST_HIGH = 70
OBJECTIVE_CONTEST_MEDIUM = 40
GAME_LENGTH_SHORT_MAX_MIN = 25
GAME_LENGTH_LONG_MIN_MIN = 35
RISK_VOLATILITY_HIGH = 60
RISK_VOLATILITY_MEDIUM = 30


def _safe_mean(values: list[float], default: float = 0.0) -> float:
    """Return mean of non-None numeric values, or default."""
    nums = [v for v in values if v is not None and not math.isnan(v)]
    if not nums:
        return default
    return sum(nums) / len(nums)


def _safe_std(values: list[float], default: float = 0.0) -> float:
    """Return sample std dev of non-None numeric values, or default."""
    nums = [v for v in values if v is not None and not math.isnan(v)]
    if len(nums) < 2:
        return default
    mean = sum(nums) / len(nums)
    variance = sum((x - mean) ** 2 for x in nums) / (len(nums) - 1)
    return math.sqrt(variance)


def _get_duration_seconds(match: dict[str, Any]) -> float | None:
    """Get match duration from match data (explicit or from last objective)."""
    # Explicit duration (if added to parsed data or raw)
    duration = match.get("duration_seconds") or match.get("durationSeconds") or match.get("game_length")
    if duration is not None:
        try:
            return float(duration)
        except (TypeError, ValueError):
            pass
    # Infer from latest objective timing
    objs = match.get("objective_timings") or []
    if not objs:
        return None
    times = []
    for o in objs:
        if not isinstance(o, dict):
            continue
        t = o.get("time_seconds") or o.get("timeSeconds") or o.get("time")
        if t is not None:
            try:
                times.append(float(t))
            except (TypeError, ValueError):
                pass
    return max(times) if times else None


def _early_aggression_score_and_label(score: float) -> dict[str, Any]:
    if score >= EARLY_AGGRESSION_HIGH:
        label = "high"
    elif score >= EARLY_AGGRESSION_MEDIUM:
        label = "medium"
    else:
        label = "low"
    return {"score": round(score, 2), "classification": label}


def _objective_contest_rate_and_label(rate: float) -> dict[str, Any]:
    if rate >= OBJECTIVE_CONTEST_HIGH:
        label = "high"
    elif rate >= OBJECTIVE_CONTEST_MEDIUM:
        label = "medium"
    else:
        label = "low"
    return {"score": round(rate, 2), "classification": label}


def _game_length_and_label(avg_seconds: float) -> dict[str, Any]:
    avg_minutes = avg_seconds / 60.0
    if avg_minutes < GAME_LENGTH_SHORT_MAX_MIN:
        label = "short"
    elif avg_minutes <= GAME_LENGTH_LONG_MIN_MIN:
        label = "medium"
    else:
        label = "long"
    return {
        "average_seconds": round(avg_seconds, 2),
        "average_minutes": round(avg_minutes, 2),
        "classification": label,
    }


def _risk_volatility_and_label(score: float) -> dict[str, Any]:
    if score >= RISK_VOLATILITY_HIGH:
        label = "high"
    elif score >= RISK_VOLATILITY_MEDIUM:
        label = "medium"
    else:
        label = "low"
    return {"score": round(score, 2), "classification": label}


def analyze_team_strategy(match_data_list: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Analyze team strategy across a list of parsed match data.

    Computes:
      - Early aggression score (0–100): tendency to secure objectives/kills in early phase.
      - Objective contest rate (0–100): how often objectives are contested (both teams involved).
      - Average game length: mean duration in seconds/minutes and classification.
      - Risk volatility score (0–100): variance in performance across games.

    Args:
        match_data_list: List of match dicts from parse_match_data() (or compatible structure).

    Returns:
        Structured JSON-serializable dict with scores and classification labels.
    """
    if not match_data_list:
        return {
            "early_aggression": _early_aggression_score_and_label(0.0),
            "objective_contest_rate": _objective_contest_rate_and_label(0.0),
            "average_game_length": _game_length_and_label(0.0),
            "risk_volatility": _risk_volatility_and_label(0.0),
            "matches_analyzed": 0,
        }
    matches = [m for m in match_data_list if isinstance(m, dict)]

    # --- Early aggression: share of objectives in first 15 min per match, then average ---
    early_ratios: list[float] = []
    for m in matches:
        objs = m.get("objective_timings") or []
        if not objs:
            continue
        early = 0
        total = 0
        for o in objs:
            if not isinstance(o, dict):
                continue
            t = o.get("time_seconds") or o.get("timeSeconds") or o.get("time")
            if t is not None:
                try:
                    total += 1
                    if float(t) <= EARLY_PHASE_SECONDS:
                        early += 1
                except (TypeError, ValueError):
                    pass
        if total > 0:
            early_ratios.append(100.0 * early / total)
    early_aggression_value = _safe_mean(early_ratios, 0.0)
    early_aggression_value = min(100.0, max(0.0, early_aggression_value))

    # --- Objective contest rate: % of matches where both teams have ≥1 objective ---
    contested_count = 0
    for m in matches:
        objs = m.get("objective_timings") or []
        team_ids = set()
        for o in objs:
            if not isinstance(o, dict):
                continue
            tid = o.get("team_id") or o.get("teamId")
            if tid is not None:
                team_ids.add(str(tid))
        if len(team_ids) >= 2:
            contested_count += 1
    objective_contest_value = 100.0 * contested_count / len(matches) if matches else 0.0
    objective_contest_value = min(100.0, max(0.0, objective_contest_value))

    # --- Average game length (seconds), from duration or last objective ---
    durations: list[float] = []
    for m in matches:
        d = _get_duration_seconds(m)
        if d is not None and d > 0:
            durations.append(d)
    avg_duration_seconds = _safe_mean(durations, 0.0)
    avg_duration_seconds = max(0.0, avg_duration_seconds)

    # --- Risk volatility: std of per-match performance (e.g. total kills per team), normalized 0–100 ---
    # Per-match performance = sum of (kills - deaths) over all players, or total kills as proxy
    per_match_scores: list[float] = []
    for m in matches:
        stats = m.get("player_stats") or []
        total_kills = 0.0
        total_deaths = 0.0
        for p in stats:
            if not isinstance(p, dict):
                continue
            k = p.get("kills") or p.get("k") or 0
            d = p.get("deaths") or p.get("d") or 0
            try:
                total_kills += float(k)
                total_deaths += float(d)
            except (TypeError, ValueError):
                pass
        # Use (kills - deaths) as performance; variance across matches = volatility
        per_match_scores.append(total_kills - total_deaths)
    volatility_std = _safe_std(per_match_scores, 0.0)
    # Normalize to 0–100: assume std in 0–20 is typical, cap at 20 for scaling
    volatility_value = min(100.0, max(0.0, (volatility_std / 20.0) * 100.0)) if volatility_std else 0.0

    return {
        "early_aggression": _early_aggression_score_and_label(early_aggression_value),
        "objective_contest_rate": _objective_contest_rate_and_label(objective_contest_value),
        "average_game_length": _game_length_and_label(avg_duration_seconds),
        "risk_volatility": _risk_volatility_and_label(volatility_value),
        "matches_analyzed": len(matches),
    }


# --- Player tendency thresholds ---
EARLY_DEATH_HIGH = 60   # % of games with 2+ deaths
EARLY_DEATH_MEDIUM = 40
PERF_VARIANCE_HIGH = 15  # std of (k - d) across games
PERF_VARIANCE_MEDIUM = 8


def _champion_from_player_stat(p: dict[str, Any]) -> str | None:
    """Get champion/hero/selection for a player stat row if present."""
    if not isinstance(p, dict):
        return None
    return p.get("champion") or p.get("selection") or p.get("hero") or p.get("pick")


def _get_player_champions_for_match(match: dict[str, Any]) -> dict[str, str]:
    """
    Return map player_id -> champion for one match.
    Uses player_stats.champion if set; else infers from draft_picks by team + order.
    """
    result: dict[str, str] = {}
    stats = match.get("player_stats") or []
    picks = match.get("draft_picks") or []

    # Direct champion on player_stats
    for p in stats:
        if not isinstance(p, dict):
            continue
        pid = p.get("player_id") or p.get("playerId")
        ch = _champion_from_player_stat(p)
        if pid is not None and ch is not None:
            result[str(pid)] = str(ch)

    if result:
        return result

    # Infer from draft_picks: group by team_id, sort by pick_order; group players by team_id; zip by index
    picks_by_team: dict[str, list[dict[str, Any]]] = {}
    for pick in picks:
        if not isinstance(pick, dict):
            continue
        tid = pick.get("team_id") or pick.get("teamId")
        if tid is None:
            continue
        tid = str(tid)
        if tid not in picks_by_team:
            picks_by_team[tid] = []
        picks_by_team[tid].append(pick)
    for tid in picks_by_team:
        def _pick_order(x: dict[str, Any]) -> float:
            o = x.get("pick_order") or x.get("order")
            if o is not None and isinstance(o, (int, float)):
                return float(o)
            return 0.0
        picks_by_team[tid].sort(key=_pick_order)

    players_by_team: dict[str, list[dict[str, Any]]] = {}
    for p in stats:
        if not isinstance(p, dict):
            continue
        tid = p.get("team_id") or p.get("teamId")
        if tid is None:
            continue
        tid = str(tid)
        if tid not in players_by_team:
            players_by_team[tid] = []
        players_by_team[tid].append(p)
    for tid in players_by_team:
        players_by_team[tid].sort(key=lambda x: str(x.get("player_id") or x.get("playerId") or ""))

    for tid, plist in players_by_team.items():
        team_picks = picks_by_team.get(tid) or []
        for i, pr in enumerate(plist):
            pid = pr.get("player_id") or pr.get("playerId")
            if pid is None:
                continue
            ch = None
            if i < len(team_picks):
                ch = team_picks[i].get("selection") or team_picks[i].get("champion") or team_picks[i].get("hero")
            if ch is not None:
                result[str(pid)] = str(ch)
    return result


def analyze_player_tendencies(match_data_list: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Analyze per-player tendencies across a list of parsed match data.

    For each player computes:
      - Most played champions (list of { champion, games }, sorted by games desc).
      - Early death frequency: % of matches where player had 2+ deaths (0–100) and classification.
      - Performance variance: std dev of (kills - deaths) across matches and classification.
      - Matchup winrate: overall win rate and by opponent team.

    Args:
        match_data_list: List of match dicts from parse_match_data() (or compatible).

    Returns:
        Structured JSON-serializable dict: players keyed by player_id, each with the metrics above.
    """
    if not match_data_list:
        return {"players": {}, "matches_analyzed": 0}

    matches = [m for m in match_data_list if isinstance(m, dict)]

    # Aggregate per player across matches
    player_matches: dict[str, list[dict[str, Any]]] = {}  # player_id -> list of match context
    player_names: dict[str, str] = {}
    # match context: { "match_id", "team_id", "opponent_team_id", "won", "kills", "deaths", "champion" }

    for m in matches:
        match_id = m.get("match_id") or m.get("id") or ""
        win_loss = m.get("win_loss") or {}
        winner = win_loss.get("winner")
        loser = win_loss.get("loser")
        teams = m.get("teams") or []
        team_ids = [str(t.get("id") or t.get("teamId") or "") for t in teams if isinstance(t, dict) and (t.get("id") or t.get("teamId"))]
        player_to_champ = _get_player_champions_for_match(m)

        for p in m.get("player_stats") or []:
            if not isinstance(p, dict):
                continue
            pid = p.get("player_id") or p.get("playerId")
            if pid is None:
                continue
            pid = str(pid)
            name = p.get("player_name") or p.get("nickname")
            if name or pid not in player_names:
                player_names[pid] = name or pid
            team_id = str(p.get("team_id") or p.get("teamId") or "")
            opponent_ids = [t for t in team_ids if t and t != team_id]
            opponent_team_id = opponent_ids[0] if opponent_ids else None
            winner_id = winner.get("id") if isinstance(winner, dict) else winner
            won = winner_id is not None and str(winner_id) == team_id
            try:
                kills = float(p.get("kills") or p.get("k") or 0)
            except (TypeError, ValueError):
                kills = 0.0
            try:
                deaths = float(p.get("deaths") or p.get("d") or 0)
            except (TypeError, ValueError):
                deaths = 0.0
            champion = player_to_champ.get(pid)

            if pid not in player_matches:
                player_matches[pid] = []
            player_matches[pid].append({
                "match_id": match_id,
                "team_id": team_id,
                "opponent_team_id": opponent_team_id,
                "won": won,
                "kills": kills,
                "deaths": deaths,
                "champion": champion,
            })

    # Build output per player
    players_out: dict[str, Any] = {}
    for pid, contexts in player_matches.items():
        total = len(contexts)
        # Most played champions
        champ_counts: dict[str, int] = {}
        for ctx in contexts:
            ch = ctx.get("champion") or "unknown"
            champ_counts[ch] = champ_counts.get(ch, 0) + 1
        most_played = sorted(
            [{"champion": ch, "games": c} for ch, c in champ_counts.items()],
            key=lambda x: -x["games"],
        )[:10]

        # Early death frequency: % of matches with 2+ deaths
        early_death_matches = sum(1 for ctx in contexts if (ctx.get("deaths") or 0) >= 2)
        early_death_rate = (100.0 * early_death_matches / total) if total else 0.0
        if early_death_rate >= EARLY_DEATH_HIGH:
            early_label = "high"
        elif early_death_rate >= EARLY_DEATH_MEDIUM:
            early_label = "medium"
        else:
            early_label = "low"

        # Performance variance: (kills - deaths) per match, then std
        perf_list = [ (ctx.get("kills") or 0) - (ctx.get("deaths") or 0) for ctx in contexts ]
        std_perf = _safe_std(perf_list, 0.0)
        var_perf = (std_perf ** 2) if std_perf else 0.0
        if std_perf >= PERF_VARIANCE_HIGH:
            perf_label = "high"
        elif std_perf >= PERF_VARIANCE_MEDIUM:
            perf_label = "medium"
        else:
            perf_label = "low"

        # Matchup winrate: overall and by opponent
        wins = sum(1 for ctx in contexts if ctx.get("won"))
        overall_wr = (100.0 * wins / total) if total else 0.0
        by_opponent: dict[str, Any] = {}
        for ctx in contexts:
            opp = ctx.get("opponent_team_id")
            if opp is None or opp == "":
                continue
            opp = str(opp)
            if opp not in by_opponent:
                by_opponent[opp] = {"wins": 0, "games": 0}
            by_opponent[opp]["games"] += 1
            if ctx.get("won"):
                by_opponent[opp]["wins"] += 1
        for opp, data in by_opponent.items():
            g = data["games"]
            data["win_rate"] = round((100.0 * data["wins"] / g), 2) if g else 0.0

        players_out[pid] = {
            "player_id": pid,
            "player_name": player_names.get(pid, pid),
            "most_played_champions": most_played,
            "early_death_frequency": {
                "rate": round(early_death_rate, 2),
                "classification": early_label,
                "matches_with_early_death": early_death_matches,
                "total_matches": total,
            },
            "performance_variance": {
                "variance": round(var_perf, 2),
                "std_dev": round(std_perf, 2),
                "classification": perf_label,
            },
            "matchup_winrate": {
                "overall": round(overall_wr, 2),
                "wins": wins,
                "games": total,
                "by_opponent": by_opponent,
            },
        }

    return {
        "players": players_out,
        "matches_analyzed": len(matches),
    }


# --- Team composition: champion -> archetype for classification (extendable) ---
CHAMPION_ARCHETYPES: dict[str, str] = {
    "ahri": "pick",
    "zed": "pick",
    "leblanc": "pick",
    "talon": "pick",
    "amumu": "teamfight",
    "orianna": "teamfight",
    "malphite": "teamfight",
    "miss fortune": "teamfight",
    "kayle": "scaling",
    "nasus": "scaling",
    "vayne": "scaling",
    "kassadin": "scaling",
    "tryndamere": "split_push",
    "fiora": "split_push",
    "yorick": "split_push",
    "pyke": "pick",
    "thresh": "pick",
}


def _get_team_composition(match: dict[str, Any], team_id: str) -> list[str]:
    """Return sorted list of champion names for one team in a match from draft_picks."""
    picks = match.get("draft_picks") or []
    champs: list[str] = []
    for p in picks:
        if not isinstance(p, dict):
            continue
        tid = p.get("team_id") or p.get("teamId")
        if str(tid) != str(team_id):
            continue
        ch = p.get("selection") or p.get("champion") or p.get("hero")
        if ch is not None:
            champs.append(str(ch).strip())
    champs.sort(key=str.lower)
    return champs


def _classify_comp(champion_list: list[str]) -> str:
    """
    Classify composition by champion archetypes: teamfight, pick, scaling, split_push, etc.
    Returns majority archetype, or 'mixed' if no majority, or 'unknown' if no champions mapped.
    """
    if not champion_list:
        return "unknown"
    counts: dict[str, int] = {}
    for ch in champion_list:
        arch = CHAMPION_ARCHETYPES.get(ch.lower()) or CHAMPION_ARCHETYPES.get(ch.lower().replace(" ", ""))
        if arch:
            counts[arch] = counts.get(arch, 0) + 1
    if not counts:
        return "unknown"
    total_mapped = sum(counts.values())
    if total_mapped < len(champion_list) / 2:
        return "unknown"
    best = max(counts.items(), key=lambda x: x[1])
    if best[1] == total_mapped:
        return best[0]
    second = sorted(counts.values(), reverse=True)
    if len(second) > 1 and second[0] == second[1]:
        return "mixed"
    return best[0]


def analyze_team_compositions(match_data_list: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Analyze team compositions across a list of parsed match data.

    Identifies:
      - Most common team comps (composition = sorted list of champion names per team).
      - Comp classification: teamfight, pick, scaling, split_push, mixed, or unknown.
      - Comp winrate: wins and games per composition.

    Args:
        match_data_list: List of match dicts from parse_match_data() (or compatible).

    Returns:
        Structured JSON-serializable dict with compositions, winrates, and classifications.
    """
    if not match_data_list:
        return {
            "compositions": [],
            "by_comp": {},
            "matches_analyzed": 0,
        }

    matches = [m for m in match_data_list if isinstance(m, dict)]
    # comp_key (tuple of sorted champ names) -> list of (won: bool, match_id)
    comp_outcomes: dict[tuple[str, ...], list[tuple[bool, str]]] = {}

    for m in matches:
        match_id = m.get("match_id") or m.get("id") or ""
        win_loss = m.get("win_loss") or {}
        winner_id = win_loss.get("winner")
        if isinstance(winner_id, dict):
            winner_id = winner_id.get("id")
        winner_id = str(winner_id) if winner_id is not None else None
        teams = m.get("teams") or []
        team_ids = [str(t.get("id") or t.get("teamId") or "") for t in teams if isinstance(t, dict) and (t.get("id") or t.get("teamId"))]
        if not team_ids:
            draft = m.get("draft_picks") or []
            team_ids = list({str(p.get("team_id") or p.get("teamId")) for p in draft if isinstance(p, dict) and (p.get("team_id") or p.get("teamId"))})

        for tid in team_ids:
            if not tid:
                continue
            comp_list = _get_team_composition(m, tid)
            if not comp_list:
                continue
            comp_key = tuple(comp_list)
            won = winner_id is not None and winner_id == tid
            if comp_key not in comp_outcomes:
                comp_outcomes[comp_key] = []
            comp_outcomes[comp_key].append((won, match_id))

    # Build most common comps with winrate and classification
    comp_list_sorted = sorted(
        comp_outcomes.items(),
        key=lambda x: -len(x[1]),
    )
    compositions: list[dict[str, Any]] = []
    by_comp: dict[str, dict[str, Any]] = {}

    for comp_key, outcomes in comp_list_sorted:
        games = len(outcomes)
        wins = sum(1 for w, _ in outcomes if w)
        win_rate = (100.0 * wins / games) if games else 0.0
        comp_list = list(comp_key)
        classification = _classify_comp(comp_list)

        comp_str = " | ".join(comp_list)
        entry = {
            "composition": comp_list,
            "games": games,
            "wins": wins,
            "win_rate": round(win_rate, 2),
            "classification": classification,
        }
        compositions.append(entry)
        by_comp[comp_str] = {
            "composition": comp_list,
            "games": games,
            "wins": wins,
            "win_rate": round(win_rate, 2),
            "classification": classification,
        }

    return {
        "compositions": compositions,
        "by_comp": by_comp,
        "matches_analyzed": len(matches),
    }


def generate_counter_strategies(team_analysis_json: dict[str, Any]) -> dict[str, Any]:
    """
    Generate counter strategies from opponent team analysis, using weaknesses in the data.

    Accepts output from analyze_team_strategy, analyze_player_tendencies, and/or
    analyze_team_compositions—either as separate objects or combined under
    team_strategy, player_tendencies, team_compositions.

    Each strategy includes:
      - strategy_text: Human-readable recommendation.
      - supporting_data: Relevant metrics or identifiers used to derive the strategy.
      - confidence_score: 0–100, based on data strength and clarity of weakness.

    Args:
        team_analysis_json: Analysis output (single or combined).

    Returns:
        Structured JSON: { "strategies": [ { strategy_text, supporting_data, confidence_score }, ... ] }
    """
    strategies: list[dict[str, Any]] = []

    # Normalize: accept flat keys or nested under team_strategy / player_tendencies / team_compositions
    team_strategy = team_analysis_json.get("team_strategy") or (
        team_analysis_json if any(k in team_analysis_json for k in ("early_aggression", "objective_contest_rate", "average_game_length", "risk_volatility")) else {}
    )
    player_tendencies = team_analysis_json.get("player_tendencies") or {}
    if "players" in team_analysis_json and "players" not in player_tendencies:
        player_tendencies = {"players": team_analysis_json["players"]}
    team_compositions = team_analysis_json.get("team_compositions") or {}
    if "compositions" in team_analysis_json and "compositions" not in team_compositions:
        team_compositions = {"compositions": team_analysis_json.get("compositions", [])}

    # --- Counter strategies from team strategy metrics ---
    if isinstance(team_strategy, dict):
        ea = team_strategy.get("early_aggression") or {}
        if isinstance(ea, dict):
            score = ea.get("score")
            label = ea.get("classification")
            if score is not None:
                if label == "low" and score < 30:
                    strategies.append({
                        "strategy_text": "Opponent shows low early aggression. Apply early pressure: invade, secure early objectives, and force skirmishes before they scale.",
                        "supporting_data": {"metric": "early_aggression", "score": score, "classification": label},
                        "confidence_score": round(70 + (30 - score) / 30 * 20, 1),
                    })
                elif label == "high" and score >= 60:
                    strategies.append({
                        "strategy_text": "Opponent is highly aggressive early. Play safe in the early phase, avoid unnecessary fights, and prioritize scaling or counter-engage.",
                        "supporting_data": {"metric": "early_aggression", "score": score, "classification": label},
                        "confidence_score": round(65 + min(score - 60, 30) / 30 * 15, 1),
                    })

        oc = team_strategy.get("objective_contest_rate") or {}
        if isinstance(oc, dict):
            score = oc.get("score")
            label = oc.get("classification")
            if score is not None and label == "low" and score < 40:
                strategies.append({
                    "strategy_text": "Opponent has low objective contest rate. Contest every major objective; they are unlikely to commit fully, giving you control of map and tempo.",
                    "supporting_data": {"metric": "objective_contest_rate", "score": score, "classification": label},
                    "confidence_score": round(72 + (40 - score) / 40 * 18, 1),
                })

        rv = team_strategy.get("risk_volatility") or {}
        if isinstance(rv, dict):
            score = rv.get("score")
            label = rv.get("classification")
            if score is not None and label in ("high", "medium") and score >= 30:
                strategies.append({
                    "strategy_text": "Opponent shows high performance volatility. They are inconsistent game-to-game; apply sustained pressure when they are behind and avoid overcommitting when they are ahead.",
                    "supporting_data": {"metric": "risk_volatility", "score": score, "classification": label},
                    "confidence_score": round(60 + min(score, 40) / 40 * 25, 1),
                })

        gl = team_strategy.get("average_game_length") or {}
        if isinstance(gl, dict):
            mins = gl.get("average_minutes")
            label = gl.get("classification")
            if mins is not None and label:
                if label == "short":
                    strategies.append({
                        "strategy_text": "Opponent tends to win in short games. Either match their tempo with early power or drag the game out and scale to deny their preferred timeline.",
                        "supporting_data": {"metric": "average_game_length", "average_minutes": mins, "classification": label},
                        "confidence_score": round(68, 1),
                    })
                elif label == "long":
                    strategies.append({
                        "strategy_text": "Opponent excels in long games. Push for an early lead and close before late game; avoid extended stall if you are not a scaling comp.",
                        "supporting_data": {"metric": "average_game_length", "average_minutes": mins, "classification": label},
                        "confidence_score": round(70, 1),
                    })

    # --- Counter strategies from player tendencies ---
    players = (player_tendencies.get("players") if isinstance(player_tendencies, dict) else {}) or {}
    for pid, pdata in players.items():
        if not isinstance(pdata, dict):
            continue
        name = pdata.get("player_name") or pid
        early = pdata.get("early_death_frequency") or {}
        if isinstance(early, dict) and (early.get("classification") == "high" or (early.get("rate") or 0) >= 60):
            strategies.append({
                "strategy_text": f"Target player {name} early; they have a high early-death frequency and are likely to give leads if pressured.",
                "supporting_data": {"player_id": pid, "player_name": name, "early_death_frequency": early},
                "confidence_score": round(65 + min(early.get("rate", 0) - 60, 30) / 30 * 20, 1),
            })
        mw = pdata.get("matchup_winrate") or {}
        if isinstance(mw, dict):
            overall = mw.get("overall")
            if overall is not None and overall < 45:
                strategies.append({
                    "strategy_text": f"Player {name} has a below-average win rate in the sample. Continue to deny them resources and priority; they underperform under pressure.",
                    "supporting_data": {"player_id": pid, "player_name": name, "matchup_winrate": overall},
                    "confidence_score": round(55 + (45 - overall) / 45 * 25, 1),
                })

    # --- Counter strategies from team compositions ---
    comps = (team_compositions.get("compositions") if isinstance(team_compositions, dict) else []) or []
    for c in comps[:10]:  # Top 10 most played comps
        if not isinstance(c, dict):
            continue
        comp_list = c.get("composition") or []
        classification = c.get("classification") or "unknown"
        win_rate = c.get("win_rate")
        games = c.get("games") or 0
        if classification == "scaling":
            strategies.append({
                "strategy_text": "Opponent frequently plays scaling compositions. End the game early, secure objectives on spawn, and avoid letting them reach late-game power spikes.",
                "supporting_data": {"composition": comp_list, "classification": classification, "win_rate": win_rate, "games": games},
                "confidence_score": round(75 if games >= 3 else 60, 1),
            })
        elif classification == "pick":
            strategies.append({
                "strategy_text": "Opponent favors pick/skirmish comps. Stay grouped, ward flanks, and avoid isolated members; force teamfights where their pick potential is reduced.",
                "supporting_data": {"composition": comp_list, "classification": classification, "win_rate": win_rate, "games": games},
                "confidence_score": round(72 if games >= 3 else 58, 1),
            })
        elif classification == "teamfight":
            strategies.append({
                "strategy_text": "Opponent relies on teamfight comps. Either match with a stronger teamfight, split the map to avoid 5v5, or engage on your terms with pick or tempo advantages.",
                "supporting_data": {"composition": comp_list, "classification": classification, "win_rate": win_rate, "games": games},
                "confidence_score": round(68 if games >= 3 else 55, 1),
            })
        elif classification == "split_push":
            strategies.append({
                "strategy_text": "Opponent uses split-push comps. Group for objectives and force 5v4 or 5v3 when their splitter is away; control vision and punish overextension.",
                "supporting_data": {"composition": comp_list, "classification": classification, "win_rate": win_rate, "games": games},
                "confidence_score": round(70 if games >= 3 else 57, 1),
            })

    # Cap confidence at 100
    for s in strategies:
        if "confidence_score" in s and s["confidence_score"] is not None:
            s["confidence_score"] = round(min(100.0, max(0.0, float(s["confidence_score"]))), 1)

    return {"strategies": strategies}
