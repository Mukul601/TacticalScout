"""Sample mock match dataset for scouting when GRID returns zero matches."""

from typing import Any


def get_mock_match_data(team_name: str, num_matches: int = 3) -> list[dict[str, Any]]:
    """
    Return a list of mock match dicts compatible with scouting engines.

    Used when GRID returns 0 matches so the scouting report still produces
    team strategy, player tendencies, team compositions, and counter strategies.

    Args:
        team_name: Requested team name (used in team labels).
        num_matches: Number of mock matches to return (default 3).

    Returns:
        List of match dicts with match_id, teams, objective_timings,
        player_stats, win_loss, draft_picks.
    """
    team_a_id = "mock_team_a"
    team_b_id = "mock_team_b"
    matches: list[dict[str, Any]] = []

    for i in range(min(num_matches, 5)):
        # Alternate wins so we get variety (team_a wins 2/3)
        team_a_wins = i % 3 != 1
        winner = team_a_id if team_a_wins else team_b_id
        loser = team_b_id if team_a_wins else team_a_id

        matches.append({
            "match_id": f"mock_match_{i + 1}",
            "teams": [
                {"id": team_a_id, "name": team_name or "Team A", "side": "blue", "score": 1 if team_a_wins else 0},
                {"id": team_b_id, "name": "Opponent", "side": "red", "score": 0 if team_a_wins else 1},
            ],
            "objective_timings": [
                {"type": "dragon", "time_seconds": 360 + i * 120, "team_id": team_a_id},
                {"type": "dragon", "time_seconds": 480 + i * 120, "team_id": team_b_id},
                {"type": "baron", "time_seconds": 1200 + i * 180, "team_id": winner},
            ],
            "player_stats": [
                {"player_id": f"p1_{i}", "player_name": "Player 1", "team_id": team_a_id, "kills": 4 + i, "deaths": 2, "assists": 5, "champion": "Ahri"},
                {"player_id": f"p2_{i}", "player_name": "Player 2", "team_id": team_a_id, "kills": 3, "deaths": 3, "assists": 8, "champion": "Amumu"},
                {"player_id": f"p3_{i}", "player_name": "Player 3", "team_id": team_a_id, "kills": 6, "deaths": 1, "assists": 4, "champion": "Vayne"},
                {"player_id": f"p4_{i}", "player_name": "Player 4", "team_id": team_b_id, "kills": 2, "deaths": 4, "assists": 3, "champion": "Zed"},
                {"player_id": f"p5_{i}", "player_name": "Player 5", "team_id": team_b_id, "kills": 3, "deaths": 5, "assists": 2, "champion": "Kayle"},
            ],
            "win_loss": {"winner": winner, "loser": loser, "winner_side": "blue" if team_a_wins else "red", "result": "win" if team_a_wins else "loss"},
            "draft_picks": [
                {"team_id": team_a_id, "pick_order": 1, "selection": "Ahri"},
                {"team_id": team_a_id, "pick_order": 2, "selection": "Amumu"},
                {"team_id": team_b_id, "pick_order": 1, "selection": "Zed"},
                {"team_id": team_b_id, "pick_order": 2, "selection": "Kayle"},
                {"team_id": team_a_id, "pick_order": 3, "selection": "Vayne"},
            ],
        })

    return matches
