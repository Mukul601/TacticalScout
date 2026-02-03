import type { ScoutingReport } from "@/types/scouting";

/**
 * Compute confidence score for scouting insights based on match sample size.
 * Mock data / zero real matches = low; more matches = higher confidence.
 */
export function getScoutingConfidence(report: ScoutingReport | null): {
  score: number;
  label: "high" | "medium" | "low";
  matchesAnalyzed: number;
} | null {
  if (!report) return null;
  const n = report.matchesAnalyzed ?? 0;
  const isMock = report.limitedDataMode === true;

  if (isMock || n === 0) {
    return { score: 25, label: "low", matchesAnalyzed: n };
  }
  if (n <= 1) return { score: 20, label: "low", matchesAnalyzed: n };
  if (n <= 2) return { score: 40, label: "low", matchesAnalyzed: n };
  if (n <= 3) return { score: 55, label: "medium", matchesAnalyzed: n };
  if (n <= 4) return { score: 70, label: "medium", matchesAnalyzed: n };
  if (n <= 5) return { score: 80, label: "high", matchesAnalyzed: n };
  if (n <= 9) return { score: 85, label: "high", matchesAnalyzed: n };
  return { score: Math.min(98, 75 + n), label: "high", matchesAnalyzed: n };
}

/**
 * Generate a summarized "How To Win vs Opponent" insight from a scouting report.
 */
export function generateHowToWinInsight(
  report: ScoutingReport | null
): { summary: string; bullets: string[] } | null {
  if (!report) return null;

  const bullets: string[] = [];
  const team = report.teamName;

  // Top counter strategies (high effectiveness first, then medium)
  const strategies = [...report.counterStrategies].sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return (order[b.effectiveness] ?? 0) - (order[a.effectiveness] ?? 0);
  });
  strategies.slice(0, 3).forEach((s) => {
    bullets.push(s.description || s.title);
  });

  // Weakness to exploit: lowest-rated strength
  if (report.strengths.length > 0) {
    const weakest = report.strengths.reduce((min, s) =>
      s.rating < min.rating ? s : min
    );
    bullets.push(
      `Exploit ${team}'s weaker ${weakest.area} (${weakest.rating}/100)—look for plays in that phase.`
    );
  }

  // Draft priority: top ban and top pick
  const bans = report.draftRisks.filter((r) => r.threat === "ban");
  const picks = report.draftRisks.filter((r) => r.threat === "pick" || r.threat === "flex");
  if (bans.length > 0) {
    const topBan = bans.sort((a, b) => b.priority - a.priority)[0];
    bullets.push(`Priority ban: ${topBan.champion} (${topBan.notes}).`);
  }
  if (picks.length > 0 && bullets.length < 6) {
    const topPick = picks.sort((a, b) => b.priority - a.priority)[0];
    bullets.push(`Contest or deny: ${topPick.champion}—${topPick.notes}`);
  }

  const summary =
    bullets.length > 0
      ? `To beat ${team}, focus on the tactics below. Use draft bans and picks to limit their comfort and play to their weaknesses.`
      : `Scouting data for ${team} is loaded. Ask the AI assistant for tailored win conditions.`;

  return { summary, bullets };
}
