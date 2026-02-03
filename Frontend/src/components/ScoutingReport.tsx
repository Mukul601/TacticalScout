import { TacticalCard } from "./TacticalCard";
import { Eye, Activity, Shield, Sword, Clock, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScoutingReport as ScoutingReportType, PlayerStat, RecentMatch, TeamStrength } from "@/types/scouting";

interface ScoutingReportProps {
  report: ScoutingReportType | null;
  isLoading?: boolean;
}

export function ScoutingReport({ report, isLoading = false }: ScoutingReportProps) {
  const getTendencyIcon = (tendency: string) => {
    switch (tendency) {
      case "aggressive": return <Sword className="w-3 h-3 text-destructive" />;
      case "defensive": return <Shield className="w-3 h-3 text-success" />;
      default: return <Activity className="w-3 h-3 text-accent" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-3 h-3 text-success" />;
      case "down": return <TrendingDown className="w-3 h-3 text-destructive" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <TacticalCard title="Scouting Report" icon={<Eye className="w-4 h-4" />} variant="cyan" badge="LOADING">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Fetching scouting data…</p>
          <div className="w-full space-y-2 animate-pulse">
            <div className="h-12 bg-secondary/50 rounded" />
            <div className="h-20 bg-secondary/50 rounded" />
            <div className="h-20 bg-secondary/50 rounded" />
          </div>
        </div>
      </TacticalCard>
    );
  }

  if (!report) {
    return (
      <TacticalCard title="Scouting Report" icon={<Eye className="w-4 h-4" />} variant="cyan" badge="NO DATA">
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select an opponent to view scouting data</p>
        </div>
      </TacticalCard>
    );
  }

  return (
    <TacticalCard 
      title="Scouting Report" 
      icon={<Eye className="w-4 h-4" />}
      variant="cyan"
      badge={report.teamName.toUpperCase()}
    >
      <div className="space-y-4">
        {/* Team Stats Overview */}
        <div className="grid grid-cols-3 gap-3 pb-4 border-b border-border">
          <div className="text-center">
            <p className="text-2xl font-orbitron font-bold text-primary text-glow-cyan">
              {report.record.wins}-{report.record.losses}
            </p>
            <p className="text-xs text-muted-foreground uppercase">Record</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-orbitron font-bold text-success">{report.winRate}%</p>
            <p className="text-xs text-muted-foreground uppercase">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-orbitron font-bold text-accent">{report.avgGameTime}</p>
            <p className="text-xs text-muted-foreground uppercase">Avg Game</p>
          </div>
        </div>

        {/* Team Strengths */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Team Strengths
          </p>
          <div className="grid grid-cols-2 gap-2">
            {report.strengths.map((strength) => (
              <div key={strength.area} className="bg-secondary/30 rounded p-2 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{strength.area}</span>
                  {getTrendIcon(strength.trend)}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={strength.rating} className="flex-1 h-1.5" />
                  <span className="text-xs font-mono text-foreground">{strength.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Stats */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Roster Analysis
          </p>
          
          {report.players.map((player) => (
            <div key={player.name} className="bg-secondary/30 rounded p-3 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-sm font-semibold text-foreground">{player.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
                    {player.role}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getTendencyIcon(player.tendency)}
                  <span className="text-xs text-muted-foreground capitalize">{player.tendency}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-muted-foreground">KDA: {player.kda}</span>
                <div className="flex items-center gap-2">
                  <Progress value={player.winRate} className="w-16 h-1.5" />
                  <span className={`font-mono ${player.winRate >= 65 ? 'text-success' : player.winRate >= 55 ? 'text-accent' : 'text-destructive'}`}>
                    {player.winRate}%
                  </span>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap">
                {player.championPool.map((champ) => (
                  <span key={champ} className="text-xs px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                    {champ}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Form */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Recent Form (Last 5)
          </p>
          <div className="flex gap-2">
            {report.recentMatches.slice(0, 5).map((match, i) => (
              <div 
                key={i}
                className={`flex-1 rounded p-2 text-center
                  ${match.result === 'W' 
                    ? 'bg-success/20 text-success border border-success/30' 
                    : 'bg-destructive/20 text-destructive border border-destructive/30'
                  }`}
              >
                <p className="font-orbitron font-bold text-sm">{match.result}</p>
                <p className="text-xs opacity-75">{match.score}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TacticalCard>
  );
}
