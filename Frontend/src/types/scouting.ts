export interface PlayerStat {
  name: string;
  role: "Top" | "Jungle" | "Mid" | "ADC" | "Support";
  kda: string;
  winRate: number;
  tendency: "aggressive" | "defensive" | "balanced";
  championPool: string[];
}

export interface RecentMatch {
  result: "W" | "L";
  opponent: string;
  score: string;
  duration: string;
}

export interface TeamStrength {
  area: string;
  rating: number;
  trend: "up" | "down" | "stable";
}

export interface CounterStrategy {
  id: string;
  title: string;
  description: string;
  effectiveness: "high" | "medium" | "low";
  phase: "early" | "mid" | "late";
}

export interface DraftRisk {
  champion: string;
  role: string;
  threat: "ban" | "pick" | "flex";
  priority: number;
  notes: string;
}

export interface ScoutingReport {
  teamName: string;
  teamLogo?: string;
  record: { wins: number; losses: number };
  winRate: number;
  avgGameTime: string;
  players: PlayerStat[];
  recentMatches: RecentMatch[];
  strengths: TeamStrength[];
  counterStrategies: CounterStrategy[];
  draftRisks: DraftRisk[];
  lastUpdated: string;
  /** True when GRID returned zero matches and backend used mock dataset fallback. */
  limitedDataMode?: boolean;
  /** Number of matches analyzed for this report (used for confidence score). */
  matchesAnalyzed?: number;
}
