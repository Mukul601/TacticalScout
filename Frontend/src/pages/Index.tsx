import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { OpponentInputForm } from "@/components/OpponentInputForm";
import { ScoutingReport } from "@/components/ScoutingReport";
import { CounterStrategyPanel } from "@/components/CounterStrategyPanel";
import { DraftRiskPanel } from "@/components/DraftRiskPanel";
import { AIChatBox } from "@/components/AIChatBox";
import { fetchScoutingReport as fetchScoutingReportApi } from "@/api/scouting";
import { analyzeDraft as analyzeDraftApi } from "@/api/draft";
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

        <main className="container mx-auto px-4 py-6">
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
              <span className="font-mono">TACTICAL OPS © 2024</span>
              <span className="font-mono">Data updated: {scoutingReport?.lastUpdated ? new Date(scoutingReport.lastUpdated).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
