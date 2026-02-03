import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TacticalCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "cyan" | "amber" | "green" | "red";
  badge?: string;
}

export function TacticalCard({ 
  title, 
  icon, 
  children, 
  className,
  variant = "cyan",
  badge
}: TacticalCardProps) {
  const variantStyles = {
    cyan: "border-glow-cyan",
    amber: "border-glow-amber", 
    green: "border-l-success",
    red: "border-l-destructive"
  };

  const headerGlow = {
    cyan: "from-primary/10",
    amber: "from-accent/10",
    green: "from-success/10",
    red: "from-destructive/10"
  };

  return (
    <div className={cn("tactical-card", variantStyles[variant], className)}>
      <div className={cn(
        "tactical-header flex items-center justify-between",
        `bg-gradient-to-b ${headerGlow[variant]} to-transparent`
      )}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h3 className="font-orbitron text-sm font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h3>
        </div>
        {badge && (
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 relative">
        <div className="scanline absolute inset-0 pointer-events-none opacity-50" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
