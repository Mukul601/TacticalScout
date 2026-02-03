import type { ScoutingReport } from "@/types/scouting";

export const INTENT_IDS = [
  "best_ban_strategy",
  "counter_comp",
  "win_conditions",
  "early_game_plan",
  "weak_player_targeting",
] as const;

export type IntentId = (typeof INTENT_IDS)[number];

/** Keywords/phrases per intent (lowercase). User question is normalized and checked for inclusion. */
const INTENT_MATCHES: Record<IntentId, string[]> = {
  best_ban_strategy: [
    "best ban",
    "ban strategy",
    "bans",
    "priority ban",
    "what to ban",
    "ban recommendation",
    "ban pick",
  ],
  counter_comp: [
    "counter their comp",
    "counter comp",
    "counter the comp",
    "counter composition",
    "counter their team",
    "counter pick",
    "counter strategy",
    "counter them",
  ],
  win_conditions: [
    "win condition",
    "win conditions",
    "how to win",
    "how do we win",
    "what do we need to win",
    "path to victory",
  ],
  early_game_plan: [
    "early game",
    "early plan",
    "early game plan",
    "early strategy",
    "early phase",
    "first 15",
    "laning",
    "early pressure",
  ],
  weak_player_targeting: [
    "weak player",
    "weakest player",
    "target which player",
    "who to target",
    "weak link",
    "exploit player",
    "focus which lane",
    "weak lane",
  ],
};

function normalize(question: string): string {
  return question.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Match user question to a known intent. Returns intent id or null.
 */
export function matchIntent(question: string): IntentId | null {
  const q = normalize(question);
  if (!q) return null;
  for (const [intentId, keywords] of Object.entries(INTENT_MATCHES) as [IntentId, string[]][]) {
    if (keywords.some((k) => q.includes(k))) return intentId;
  }
  return null;
}

/**
 * Build predefined strategic response from scouting report for a given intent.
 * Returns empty string if report is missing and response needs data.
 */
export function getPredefinedResponse(
  intentId: IntentId,
  report: ScoutingReport | null
): string {
  const team = report?.teamName ?? "Opponent";

  if (!report) {
    return `No scouting data loaded. Select an opponent and generate a report to get ${intentId.replace(/_/g, " ")} insights.`;
  }

  switch (intentId) {
    case "best_ban_strategy": {
      const bans = report.draftRisks.filter((r) => r.threat === "ban").sort((a, b) => b.priority - a.priority);
      if (bans.length === 0) {
        return `No priority bans identified for ${team} in the current report. Check draft risks after loading more data.`;
      }
      const top = bans.slice(0, 5);
      const lines = top.map((b) => `• ${b.champion} (${b.priority}%): ${b.notes}`);
      return `Best ban strategy vs ${team}:\n\n${lines.join("\n")}\n\nPrioritize banning ${top[0].champion} when possible.`;
    }

    case "counter_comp": {
      const strategies = [...report.counterStrategies]
        .filter((s) => s.effectiveness === "high" || s.effectiveness === "medium")
        .slice(0, 5);
      if (strategies.length === 0) {
        return `No counter-comp strategies generated yet for ${team}. Ensure scouting report has been generated.`;
      }
      const lines = strategies.map((s) => `• [${s.effectiveness}] ${s.description}`);
      return `Counter ${team}'s comp:\n\n${lines.join("\n")}`;
    }

    case "win_conditions": {
      const high = report.counterStrategies.filter((s) => s.effectiveness === "high");
      const weak = report.strengths.length > 0
        ? report.strengths.reduce((min, s) => (s.rating < min.rating ? s : min))
        : null;
      const parts: string[] = [];
      if (high.length > 0) {
        parts.push("Key strategies: " + high.map((s) => s.description).join(" ") + ".");
      }
      if (weak) {
        parts.push(`Exploit: Their weaker ${weak.area} (${weak.rating}/100)—play around that phase.`);
      }
      if (report.draftRisks.length > 0) {
        const topBan = report.draftRisks.filter((r) => r.threat === "ban").sort((a, b) => b.priority - a.priority)[0];
        if (topBan) parts.push(`Draft: Deny ${topBan.champion} (${topBan.notes}).`);
      }
      return parts.length > 0
        ? `Win conditions vs ${team}:\n\n${parts.join("\n\n")}`
        : `Win conditions for ${team} will appear here once counter strategies and strengths are available.`;
    }

    case "early_game_plan": {
      const early = report.counterStrategies.filter((s) => s.phase === "early");
      const earlyRisks = report.draftRisks.filter((r) => r.threat === "pick" || r.threat === "flex").slice(0, 3);
      const parts: string[] = [];
      if (early.length > 0) {
        parts.push("Early-phase strategies:\n" + early.map((s) => `• ${s.description}`).join("\n"));
      }
      if (earlyRisks.length > 0) {
        parts.push("Contest early: " + earlyRisks.map((r) => r.champion).join(", ") + "—" + earlyRisks[0].notes);
      }
      if (report.strengths.length > 0) {
        const earlyStrength = report.strengths.find((s) => s.area.toLowerCase().includes("early"));
        if (earlyStrength) {
          parts.push(`Note: ${team}'s early rating (${earlyStrength.area}) is ${earlyStrength.rating}/100—${earlyStrength.trend === "up" ? "they're strong early; play safe or match pressure." : "look to exploit if we have stronger early."}`);
        }
      }
      return parts.length > 0
        ? `Early game plan vs ${team}:\n\n${parts.join("\n\n")}`
        : `Early game plan for ${team}: generate a scouting report to see early-phase strategies and draft priorities.`;
    }

    case "weak_player_targeting": {
      const players = [...report.players].sort((a, b) => a.winRate - b.winRate);
      if (players.length === 0) {
        return `No player-level data for ${team} in this report. Load more matches to see weak-player targeting.`;
      }
      const weakest = players[0];
      const low = players.filter((p) => p.winRate < 55).slice(0, 3);
      const lines = low.map((p) => `• ${p.name} (${p.role}): ${p.winRate}% win rate, ${p.tendency}—${p.championPool?.slice(0, 2).join("/") ?? "—"}`);
      return `Weak player targeting vs ${team}:\n\nFocus pressure on ${weakest.name} (${weakest.role}, ${weakest.winRate}% win rate, ${weakest.tendency}).\n\n${lines.join("\n")}\n\nDeny their comfort picks and exploit ${weakest.name}'s tendency in lane.`;
    }

    default:
      return "";
  }
}
