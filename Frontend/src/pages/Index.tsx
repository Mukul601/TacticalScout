import { useState, useEffect, useCallback } from "react";
import { Trophy } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OpponentInputForm } from "@/components/OpponentInputForm";
import { ScoutingReport } from "@/components/ScoutingReport";
import { CounterStrategyPanel } from "@/components/CounterStrategyPanel";
import { DraftRiskPanel } from "@/components/DraftRiskPanel";
import { AIChatBox } from "@/components/AIChatBox";
import { fetchScoutingReport as fetchScoutingReportApi } from "@/api/scouting";
import { analyzeDraft as analyzeDraftApi } from "@/api/draft";
import { generateHowToWinInsight, getScoutingConfidence } from "@/lib/insight";
import { ScoutingReport as ScoutingReportType } from "@/types/scouting";
import type { DraftAnalysisResponse } from "@/api/draft";

const DEFAULT_TEAMS = ["Team Liquid", "Cloud9", "FlyQuest", "G2", "Fnatic"];

const Index = () => {
  const [selectedOpponent, setSelectedOpponent] = useState("Team Liquid");
  const [scoutingReport, setScoutingReport] = useState<ScoutingReportType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftAnalysis, setDraftAnalysis] = useState<DraftAnalysisResponse | null>(null);
  const [draftAnalysisLoading, setDraftAnalysisLoading] = useState(false);

  const fetchScoutingReport = useCallback(async (teamName: string) => {
    if (!teamName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const report = await fetchScoutingReportApi(teamName, 5);
      setScoutingReport(report);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to load scouting report";
      setError(message);
      setScoutingReport(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScoutingReport(selectedOpponent);
  }, [selectedOpponent, fetchScoutingReport]);

  const handleOpponentSelect = (teamName: string) => {
    setSelectedOpponent(teamName);
  };

  const handleAnalyzeDraft = useCallback(async (draftList: string[]) => {
    setDraftAnalysisLoading(true);
    setDraftAnalysis(null);
    try {
      const result = await analyzeDraftApi(draftList);
      setDraftAnalysis(result);
    } catch {
      setDraftAnalysis(null);
    } finally {
      setDraftAnalysisLoading(false);
    }
  }, []);

  const howToWinInsight = generateHowToWinInsight(scoutingReport);
  const scoutingConfidence = getScoutingConfidence(scoutingReport);

  // Compute dashboard stats from current report
  const dashboardStats = [
    { 
      label: "Match Analysis", 
      value: scoutingReport ? `${scoutingReport.record.wins + scoutingReport.record.losses}` : "—", 
      trend: "+12%" 
    },
    { 
      label: "Win Prediction", 
      value: scoutingReport ? `${(100 - scoutingReport.winRate + 10).toFixed(1)}%` : "—", 
      trend: "+5.4%" 
    },
    { 
      label: "Strategies Generated", 
      value: scoutingReport ? `${scoutingReport.counterStrategies.length}` : "—", 
      trend: "Active" 
    },
    { 
      label: "Data Points", 
      value: "2.4M", 
      trend: "Live" 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10">
        <DashboardHeader />

        {scoutingReport?.limitedDataMode && (
          <div className="border-b border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium">
              <span className="font-mono uppercase tracking-wider">Limited Data Mode</span>
              <span className="text-muted-foreground font-normal">
                — No GRID matches found; report uses sample data for this team.
              </span>
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 py-6">
          {/* How To Win vs Opponent - highlighted insight */}
          {!isLoading && howToWinInsight && scoutingReport && (
            <div className="mb-6 rounded-lg border-2 border-success/50 bg-gradient-to-br from-success/10 via-background to-primary/5 p-5 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-success/20 border border-success/40">
                  <Trophy className="h-6 w-6 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h2 className="font-orbitron text-lg font-bold uppercase tracking-wider text-foreground">
                      How To Win vs {scoutingReport.teamName}
                    </h2>
                    {scoutingConfidence && (
                      <span
                        className={`font-mono text-xs px-2 py-1 rounded border ${
                          scoutingConfidence.label === "high"
                            ? "bg-success/20 text-success border-success/40"
                            : scoutingConfidence.label === "medium"
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
                              : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        Confidence: {scoutingConfidence.score}% ({scoutingConfidence.matchesAnalyzed} match{scoutingConfidence.matchesAnalyzed !== 1 ? "es" : ""})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {howToWinInsight.summary}
                  </p>
                  <ul className="space-y-2">
                    {howToWinInsight.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-foreground"
                      >
                        <span className="text-success font-bold shrink-0">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {dashboardStats.map((stat) => (
              <div 
                key={stat.label}
                className="tactical-card px-4 py-3"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-orbitron text-2xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-xs text-success font-mono">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column - Input & Scouting */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <OpponentInputForm 
                onSubmit={handleOpponentSelect} 
                availableTeams={DEFAULT_TEAMS}
              />
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <ScoutingReport report={scoutingReport} isLoading={isLoading} />
            </div>

            {/* Center Column - Strategies */}
            <div className="col-span-12 lg:col-span-5 space-y-4">
              <CounterStrategyPanel 
                strategies={scoutingReport?.counterStrategies || []} 
                isLoading={isLoading}
              />
              <DraftRiskPanel 
                risks={scoutingReport?.draftRisks || []} 
                isLoading={isLoading}
                draftAnalysis={draftAnalysis}
                draftAnalysisLoading={draftAnalysisLoading}
                onAnalyzeDraft={handleAnalyzeDraft}
              />
            </div>

            {/* Right Column - AI Chat */}
            <div className="col-span-12 lg:col-span-4">
              <AIChatBox scoutingReport={scoutingReport} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 mt-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">Tactical Scout © 2024</span>
              <span className="font-mono">Data updated: {scoutingReport?.lastUpdated ? new Date(scoutingReport.lastUpdated).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
