import { useState } from "react";
import { TacticalCard } from "./TacticalCard";
import { AlertTriangle, Ban, Star, TrendingUp, Info, Search, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DraftRisk } from "@/types/scouting";
import type { DraftAnalysisResponse } from "@/api/draft";

interface DraftRiskPanelProps {
  risks: DraftRisk[];
  isLoading?: boolean;
  /** Result from analyzeDraft(); when set, panel shows this instead of scouting risks */
  draftAnalysis?: DraftAnalysisResponse | null;
  draftAnalysisLoading?: boolean;
  onAnalyzeDraft?: (draftList: string[]) => void;
}

export function DraftRiskPanel({
  risks,
  isLoading = false,
  draftAnalysis = null,
  draftAnalysisLoading = false,
  onAnalyzeDraft,
}: DraftRiskPanelProps) {
  const [draftInput, setDraftInput] = useState("");

  const getRiskBadge = (threat: string) => {
    switch (threat) {
      case "ban":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30">
            <Ban className="w-3 h-3" /> PRIORITY BAN
          </span>
        );
      case "pick":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
            <Star className="w-3 h-3" /> HIGH PICK
          </span>
        );
      case "flex":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
            <TrendingUp className="w-3 h-3" /> FLEX PICK
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-success/20 text-success border border-success/30">
            COMFORT
          </span>
        );
    }
  };

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const list = draftInput
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0 && onAnalyzeDraft) onAnalyzeDraft(list);
  };

  const showDraftAnalysis = draftAnalysis && !draftAnalysisLoading;
  const panelLoading = isLoading && !showDraftAnalysis;

  if (panelLoading) {
    return (
      <TacticalCard
        title="Draft Risk Analysis"
        icon={<AlertTriangle className="w-4 h-4" />}
        variant="amber"
        badge="LOADING"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading draft risks…</p>
          <div className="w-full space-y-2 animate-pulse">
            <div className="h-12 bg-secondary/50 rounded" />
            <div className="h-20 bg-secondary/50 rounded" />
            <div className="h-20 bg-secondary/50 rounded" />
          </div>
        </div>
      </TacticalCard>
    );
  }

  const synergyScore = showDraftAnalysis?.synergy?.score ?? 0;
  const damageScore = showDraftAnalysis?.damage_composition?.score ?? 0;
  const alerts = showDraftAnalysis?.risk_alerts ?? [];
  const overallScore =
    showDraftAnalysis && alerts.length > 0
      ? Math.min(
          100,
          Math.round(100 - (synergyScore + damageScore) / 2) + alerts.length * 10
        )
      : Math.round((synergyScore + damageScore) / 2);

  const badgeLabel =
    showDraftAnalysis
      ? overallScore >= 70
        ? "BALANCED"
        : overallScore >= 40
          ? "MODERATE"
          : "RISKY"
      : risks.length > 0
        ? Math.round(
            risks.reduce((sum, r) => sum + r.priority, 0) / risks.length
          ) >= 80
          ? "HIGH ALERT"
          : "MODERATE"
        : "LOW";

  return (
    <TacticalCard
      title="Draft Risk Analysis"
      icon={<AlertTriangle className="w-4 h-4" />}
      variant="amber"
      badge={draftAnalysisLoading ? "ANALYZING…" : badgeLabel}
    >
      <div className="space-y-4">
        {/* Analyze draft form */}
        {onAnalyzeDraft && (
          <form onSubmit={handleAnalyzeSubmit} className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                placeholder="Champions: Ahri, Amumu, Vayne, Thresh, Kayle"
                className="flex-1 bg-secondary/50 border-border text-sm font-mono"
                disabled={draftAnalysisLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={
                  draftAnalysisLoading ||
                  !draftInput.trim().replace(/[\s,;]+/g, "").length
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {draftAnalysisLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        )}

        {draftAnalysisLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4 rounded-lg bg-secondary/30 border border-border">
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
            <span>Analyzing draft…</span>
          </div>
        )}

        {/* Draft analysis result */}
        {showDraftAnalysis && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/30 border border-border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Synergy
                </p>
                <p className="font-orbitron text-lg font-bold text-foreground">
                  {draftAnalysis.synergy?.score ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {draftAnalysis.synergy?.classification ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/30 border border-border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Damage balance
                </p>
                <p className="font-orbitron text-lg font-bold text-foreground">
                  {draftAnalysis.damage_composition?.score ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {draftAnalysis.damage_composition?.classification ?? "—"}
                </p>
              </div>
            </div>
            {draftAnalysis.role_coverage && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  Role coverage
                </p>
                <p className="text-sm text-foreground capitalize">
                  {draftAnalysis.role_coverage.status ?? "—"}
                  {draftAnalysis.role_coverage.missing_roles?.length
                    ? ` • Missing: ${draftAnalysis.role_coverage.missing_roles.join(", ")}`
                    : ""}
                </p>
              </div>
            )}
            {alerts.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  Risk alerts
                </p>
                <div className="space-y-2">
                  {alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`rounded p-2 border text-xs ${
                        alert.severity === "high"
                          ? "bg-destructive/10 border-destructive/30 text-destructive"
                          : alert.severity === "medium"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                            : "bg-secondary/30 border-border text-muted-foreground"
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Scouting-based risks (when no draft analysis shown) */}
        {!showDraftAnalysis &&
          !draftAnalysisLoading &&
          (() => {
              const banPriority = risks
                .filter((r) => r.threat === "ban")
                .sort((a, b) => b.priority - a.priority);
              const otherRisks = risks
                .filter((r) => r.threat !== "ban")
                .sort((a, b) => b.priority - a.priority);
              const overallThreat =
                risks.length > 0
                  ? Math.round(
                      risks.reduce((sum, r) => sum + r.priority, 0) /
                        risks.length
                    )
                  : 0;
              return (
                <>
                  {banPriority.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Ban className="w-3 h-3 text-destructive" />
                        Suggested Bans
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {banPriority.map((risk) => (
                          <Tooltip key={risk.champion}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 px-3 py-2 rounded bg-destructive/10 border border-destructive/30 text-destructive cursor-help">
                                <Ban className="w-4 h-4" />
                                <span className="font-orbitron text-sm">
                                  {risk.champion}
                                </span>
                                <span className="text-xs opacity-75">
                                  ({risk.priority}%)
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{risk.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )}
                  {otherRisks.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Star className="w-3 h-3 text-primary" />
                        Enemy Priority Picks
                      </p>
                      <div className="space-y-2">
                        {otherRisks.map((risk) => (
                          <div
                            key={risk.champion}
                            className="bg-secondary/30 rounded p-3 border border-border hover:border-accent/30 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center font-orbitron font-bold text-primary text-sm border border-primary/30">
                                  {risk.champion.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-orbitron text-sm font-semibold text-foreground">
                                    {risk.champion}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {risk.role}
                                  </p>
                                </div>
                              </div>
                              {getRiskBadge(risk.threat)}
                            </div>
                            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/50">
                              <span className="text-muted-foreground">
                                {risk.notes}
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 cursor-help">
                                    <Info className="w-3 h-3 text-muted-foreground" />
                                    <span
                                      className={`font-mono font-semibold ${
                                        risk.priority >= 80
                                          ? "text-destructive"
                                          : risk.priority >= 70
                                            ? "text-accent"
                                            : "text-muted-foreground"
                                      }`}
                                    >
                                      {risk.priority}%
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">
                                    Priority score based on threat level
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase">
                        Overall Draft Threat
                      </span>
                      <span
                        className={`font-orbitron font-bold ${
                          overallThreat >= 80
                            ? "text-destructive"
                            : overallThreat >= 60
                              ? "text-accent text-glow-amber"
                              : "text-success"
                        }`}
                      >
                        {overallThreat >= 80
                          ? "CRITICAL"
                          : overallThreat >= 60
                            ? "HIGH"
                            : "MODERATE"}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
      </div>
    </TacticalCard>
  );
}
