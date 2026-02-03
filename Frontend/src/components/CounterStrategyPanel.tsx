import { TacticalCard } from "./TacticalCard";
import { Zap, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CounterStrategy } from "@/types/scouting";

interface CounterStrategyPanelProps {
  strategies: CounterStrategy[];
  isLoading?: boolean;
}

export function CounterStrategyPanel({ strategies, isLoading = false }: CounterStrategyPanelProps) {
  const getEffectivenessIcon = (eff: string) => {
    switch (eff) {
      case "high": return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "medium": return <AlertTriangle className="w-4 h-4 text-accent" />;
      default: return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getEffectivenessStyle = (eff: string) => {
    switch (eff) {
      case "high": return "border-l-success glow-green";
      case "medium": return "border-l-accent glow-amber";
      default: return "border-l-destructive glow-red";
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case "early": return "Early Game";
      case "mid": return "Mid Game";
      case "late": return "Late Game";
      default: return phase;
    }
  };

  if (isLoading) {
    return (
      <TacticalCard title="Counter Strategies" icon={<Zap className="w-4 h-4" />} variant="green" badge="LOADING">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading strategies…</p>
          <div className="w-full space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-secondary/50 rounded" />
            ))}
          </div>
        </div>
      </TacticalCard>
    );
  }

  const highEffectiveness = strategies.filter(s => s.effectiveness === "high").length;

  return (
    <TacticalCard 
      title="Counter Strategies" 
      icon={<Zap className="w-4 h-4" />}
      variant="green"
      badge={`${strategies.length} ACTIVE`}
    >
      <div className="space-y-3">
        {strategies.map((strategy) => (
          <div 
            key={strategy.id}
            className={`bg-secondary/30 rounded p-3 border-l-2 border border-border hover:bg-secondary/50 transition-all cursor-pointer group ${getEffectivenessStyle(strategy.effectiveness)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getEffectivenessIcon(strategy.effectiveness)}
                <h4 className="font-orbitron text-sm font-semibold text-foreground">
                  {strategy.title}
                </h4>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {strategy.description}
            </p>
            
            <div className="flex flex-wrap gap-1.5">
              <Badge 
                variant="outline" 
                className="text-xs font-mono bg-secondary/50 border-border text-muted-foreground"
              >
                {getPhaseLabel(strategy.phase)}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs font-mono bg-secondary/50 border-border capitalize
                  ${strategy.effectiveness === 'high' ? 'text-success border-success/30' : 
                    strategy.effectiveness === 'medium' ? 'text-accent border-accent/30' : 'text-destructive border-destructive/30'}`}
              >
                {strategy.effectiveness} impact
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>High Impact Strategies</span>
          <span className="font-mono text-success">{highEffectiveness} / {strategies.length}</span>
        </div>
        <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-success to-primary rounded-full transition-all"
            style={{ width: `${(highEffectiveness / strategies.length) * 100}%` }}
          />
        </div>
      </div>
    </TacticalCard>
  );
}
