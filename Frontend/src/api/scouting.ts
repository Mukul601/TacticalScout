import axios from "axios";
import type {
  ScoutingReport,
  CounterStrategy,
  DraftRisk,
  PlayerStat,
  TeamStrength,
} from "@/types/scouting";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

/** Raw response from POST /generate-scouting-report */
export interface ScoutingReportApiResponse {
  team?: { id?: string; name?: string };
  matches_analyzed?: number;
  mock_data_used?: boolean;
  team_strategy?: {
    early_aggression?: { score?: number; classification?: string };
    objective_contest_rate?: { score?: number; classification?: string };
    average_game_length?: {
      average_seconds?: number;
      average_minutes?: number;
      classification?: string;
    };
    risk_volatility?: { score?: number; classification?: string };
  };
  player_tendencies?: {
    players?: Record<
      string,
      {
        player_id?: string;
        player_name?: string;
        most_played_champions?: { champion: string; games: number }[];
        early_death_frequency?: { rate?: number; classification?: string };
        performance_variance?: { classification?: string };
        matchup_winrate?: { overall?: number; wins?: number; games?: number };
      }
    >;
  };
  team_compositions?: { compositions?: { win_rate?: number }[] };
  counter_strategies?: {
    strategies?: {
      strategy_text?: string;
      supporting_data?: unknown;
      confidence_score?: number;
    }[];
  };
}

const ROLES: PlayerStat["role"][] = [
  "Top",
  "Jungle",
  "Mid",
  "ADC",
  "Support",
];

function formatGameTime(minutes?: number): string {
  if (minutes == null || Number.isNaN(minutes)) return "—";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function confidenceToEffectiveness(score?: number): "high" | "medium" | "low" {
  if (score == null) return "medium";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function classificationToTrend(classification?: string): "up" | "down" | "stable" {
  if (classification === "high") return "up";
  if (classification === "low") return "down";
  return "stable";
}

/** Map backend API response to frontend ScoutingReport shape. */
export function mapApiResponseToScoutingReport(
  data: ScoutingReportApiResponse,
  teamName: string
): ScoutingReport {
  const team = data.team;
  const matchesAnalyzed = data.matches_analyzed ?? 0;
  const teamStrategy = data.team_strategy ?? {};
  const playerTendencies = data.player_tendencies?.players ?? {};
  const strategies = data.counter_strategies?.strategies ?? [];
  const compositions = data.team_compositions?.compositions ?? [];

  const displayName = team?.name ?? teamName;
  const avgLength = teamStrategy.average_game_length;
  const avgMinutes = avgLength?.average_minutes;

  const totalWins = compositions.reduce(
    (sum, c) => sum + ((c as { wins?: number }).wins ?? 0),
    0
  );
  const totalGames = compositions.reduce(
    (sum, c) => sum + ((c as { games?: number }).games ?? 0),
    0
  );
  const recordWins =
    totalGames > 0 ? totalWins : Math.floor(matchesAnalyzed / 2);
  const recordLosses =
    totalGames > 0 ? totalGames - totalWins : matchesAnalyzed - recordWins;
  const winRate =
    totalGames > 0
      ? Math.round((100 * totalWins) / totalGames)
      : compositions.length
        ? (compositions[0] as { win_rate?: number }).win_rate ?? 50
        : 50;

  const players: PlayerStat[] = Object.values(playerTendencies).map(
    (p, index) => {
      const champPool = (p.most_played_champions ?? [])
        .slice(0, 5)
        .map((c) => c.champion);
      const tendency =
        p.early_death_frequency?.classification === "high"
          ? "aggressive"
          : p.performance_variance?.classification === "low"
            ? "defensive"
            : "balanced";
      return {
        name: p.player_name ?? p.player_id ?? "Unknown",
        role: ROLES[index % ROLES.length],
        kda: "—",
        winRate: Math.round(p.matchup_winrate?.overall ?? 0),
        tendency,
        championPool: champPool.length ? champPool : ["—"],
      };
    }
  );

  const strengths: TeamStrength[] = [];
  const ea = teamStrategy.early_aggression;
  if (ea?.score != null)
    strengths.push({
      area: "Early Game",
      rating: Math.round(ea.score),
      trend: classificationToTrend(ea.classification),
    });
  const oc = teamStrategy.objective_contest_rate;
  if (oc?.score != null)
    strengths.push({
      area: "Objective Control",
      rating: Math.round(oc.score),
      trend: classificationToTrend(oc.classification),
    });
  const rv = teamStrategy.risk_volatility;
  if (rv?.score != null)
    strengths.push({
      area: "Risk Volatility",
      rating: Math.round(rv.score),
      trend: classificationToTrend(rv.classification),
    });
  if (strengths.length === 0)
    strengths.push({ area: "Analysis", rating: 50, trend: "stable" });

  const counterStrategies: CounterStrategy[] = strategies.map((s, i) => ({
    id: `cs-${i}`,
    title:
      (s.strategy_text ?? "").slice(0, 50) +
      ((s.strategy_text?.length ?? 0) > 50 ? "…" : ""),
    description: s.strategy_text ?? "",
    effectiveness: confidenceToEffectiveness(s.confidence_score),
    phase: "mid",
  }));

  const draftRisks: DraftRisk[] = [];
  Object.values(playerTendencies).forEach((p, playerIndex) => {
    const role = ROLES[playerIndex % ROLES.length];
    (p.most_played_champions ?? []).slice(0, 2).forEach((c) => {
      draftRisks.push({
        champion: c.champion,
        role,
        threat: "pick",
        priority: Math.min(95, 50 + c.games * 10),
        notes: `${p.player_name ?? "Player"} – ${c.games} games`,
      });
    });
  });
  draftRisks.sort((a, b) => b.priority - a.priority);
  const draftRisksTop = draftRisks.slice(0, 8);

  return {
    teamName: displayName,
    record: { wins: recordWins, losses: Math.max(0, recordLosses) },
    winRate: Math.round(winRate),
    avgGameTime: formatGameTime(avgMinutes),
    players,
    recentMatches: [],
    strengths,
    counterStrategies,
    draftRisks: draftRisksTop,
    lastUpdated: new Date().toISOString(),
    limitedDataMode: data.mock_data_used ?? false,
    matchesAnalyzed,
  };
}

/**
 * Fetch scouting report from backend.
 * POST /generate-scouting-report with team_name and match_limit: 5.
 */
export async function fetchScoutingReport(
  teamName: string,
  matchLimit: number = 5
): Promise<ScoutingReport> {
  const { data } = await axios.post<ScoutingReportApiResponse>(
    `${API_BASE}/generate-scouting-report`,
    { team_name: teamName, match_limit: matchLimit },
    { timeout: 30000 }
  );
  return mapApiResponseToScoutingReport(data, teamName);
}
