import { useState } from "react";
import { TacticalCard } from "./TacticalCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Target, Users, Crosshair } from "lucide-react";

interface OpponentInputFormProps {
  onSubmit: (opponent: string) => void;
  availableTeams?: string[];
}

export function OpponentInputForm({ onSubmit, availableTeams = [] }: OpponentInputFormProps) {
  const [opponent, setOpponent] = useState("");
  
  // Use available teams from mock data, fallback to defaults
  const recentSearches = availableTeams.length > 0 
    ? availableTeams 
    : ["Team Liquid", "Cloud9", "Fnatic", "G2 Esports"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (opponent.trim()) {
      onSubmit(opponent);
    }
  };

  return (
    <TacticalCard 
      title="Target Acquisition" 
      icon={<Target className="w-4 h-4" />}
      variant="cyan"
      badge="ACTIVE"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Enter opponent team name..."
            className="pl-10 bg-secondary/50 border-border focus:border-primary focus:glow-cyan font-rajdhani"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan font-orbitron text-sm uppercase tracking-wider"
        >
          <Crosshair className="w-4 h-4 mr-2" />
          Lock Target
        </Button>
      </form>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Users className="w-3 h-3" />
          Recent Targets
        </p>
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((team) => (
            <button
              key={team}
              onClick={() => setOpponent(team)}
              className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-primary/50 font-mono"
            >
              {team}
            </button>
          ))}
        </div>
      </div>
    </TacticalCard>
  );
}
