import { Crosshair, Radio, Clock, Wifi, Gamepad2 } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-primary/20 border border-primary/50 flex items-center justify-center glow-cyan">
              <Crosshair className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-orbitron text-xl font-bold tracking-wider text-foreground text-glow-cyan">
                Tactical Scout
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                AI Powered Esports Scouting & Draft Intelligence
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <Gamepad2 className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                <span>Game Supported: League of Legends (GRID Data Enabled)</span>
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-6">
            {/* Live Status */}
            <div className="flex items-center gap-2 text-success">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-mono uppercase">Systems Online</span>
            </div>

            {/* Connection */}
            <div className="flex items-center gap-2 text-primary">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-mono">Connected</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-mono">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
