import { Button } from '@/components/ui/button';
import { AlertTriangle, Map, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-command-bg via-command-surface to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--command-accent)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--severity-critical)/0.1),transparent_50%)]" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-20 map-grid" />

      <div className="container relative z-10 px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-command-accent/30 bg-command-accent/10 text-command-accent font-mono text-sm">
              <Zap className="h-4 w-4" />
              REAL-TIME EMERGENCY COORDINATION
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Crisis Response
              <span className="block text-command-accent">For Communities</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Report incidents, track resources, and coordinate emergency response in one unified platform. 
              Built for communities, agencies, and coordinators working together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
            </div>
          </div>

          {/* Right dashboard mockup */}
          <div className="relative animate-fade-in" style={{ animationDelay: '200ms' }}>
            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-command-accent/20 blur-3xl rounded-3xl" />
      
      <div className="relative border-2 border-foreground bg-card shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 bg-command-bg">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-severity-critical animate-pulse" />
            <span className="font-mono text-xs text-primary-foreground">READY RESPONSE OPS</span>
          </div>
          <div className="flex gap-2">
            <div className="h-3 w-3 border border-muted-foreground" />
            <div className="h-3 w-3 border border-muted-foreground" />
            <div className="h-3 w-3 bg-severity-critical" />
          </div>
        </div>

        {/* Map area */}
        <div className="relative h-64 md:h-80 bg-secondary map-grid overflow-hidden">
          {/* Incident markers */}
          <IncidentMarker x={25} y={30} severity="critical" pulse />
          <IncidentMarker x={60} y={45} severity="high" />
          <IncidentMarker x={40} y={70} severity="medium" />
          <IncidentMarker x={75} y={25} severity="low" />
          
          {/* Resource markers */}
          <ResourceMarker x={30} y={50} />
          <ResourceMarker x={55} y={35} />
          <ResourceMarker x={70} y={60} />

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="30%" y1="50%" x2="25%" y2="30%" className="stroke-command-accent/40" strokeWidth="1" strokeDasharray="4" />
            <line x1="55%" y1="35%" x2="60%" y2="45%" className="stroke-command-accent/40" strokeWidth="1" strokeDasharray="4" />
          </svg>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t-2 border-foreground px-4 py-2 bg-command-bg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-severity-critical animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground">3 ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-status-active" />
              <span className="font-mono text-xs text-muted-foreground">5 RESOURCES</span>
            </div>
          </div>
          <span className="font-mono text-xs text-command-accent">LIVE</span>
        </div>
      </div>
    </div>
  );
}

function IncidentMarker({ x, y, severity, pulse }: { x: number; y: number; severity: string; pulse?: boolean }) {
  const colors: Record<string, string> = {
    critical: 'bg-severity-critical',
    high: 'bg-severity-high',
    medium: 'bg-severity-medium',
    low: 'bg-severity-low',
  };

  return (
    <div 
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${pulse ? 'animate-pulse' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`h-6 w-6 ${colors[severity]} border-2 border-foreground flex items-center justify-center`}>
        <AlertTriangle className="h-3 w-3 text-background" />
      </div>
    </div>
  );
}

function ResourceMarker({ x, y }: { x: number; y: number }) {
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="h-5 w-5 bg-status-active border-2 border-foreground rounded-full" />
    </div>
  );
}
