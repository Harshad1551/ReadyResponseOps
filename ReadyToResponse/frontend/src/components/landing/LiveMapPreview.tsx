import { AlertTriangle, Radio, Truck, Clock } from 'lucide-react';

export function LiveMapPreview() {
  return (
    <section className="py-20 bg-secondary relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30 map-grid" />
      
      <div className="container relative z-10 px-6">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-command-accent/30 bg-command-accent/10 text-command-accent font-mono text-xs">
            <Radio className="h-3 w-3 animate-pulse" />
            REAL-TIME AWARENESS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            See Everything. Respond Faster.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch incidents appear in real-time, track resource movements, and coordinate response 
            with a live operational picture.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Map container */}
          <div className="relative border-2 border-foreground bg-card shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 bg-command-bg">
              <span className="font-mono text-xs text-primary-foreground tracking-wider">LIVE SITUATIONAL MAP</span>
              <div className="flex items-center gap-4">
                <LegendItem color="bg-severity-critical" label="CRITICAL" pulse />
                <LegendItem color="bg-severity-high" label="HIGH" />
                <LegendItem color="bg-status-active" label="RESOURCES" />
              </div>
            </div>

            {/* Map content */}
            <div className="relative h-80 md:h-96 bg-background map-grid">
              {/* Animated incident markers */}
              <AnimatedIncident x={20} y={25} severity="critical" delay={0} label="Structure Fire" />
              <AnimatedIncident x={45} y={55} severity="high" delay={1} label="Medical Emergency" />
              <AnimatedIncident x={70} y={35} severity="medium" delay={2} label="Traffic Collision" />
              <AnimatedIncident x={35} y={75} severity="low" delay={3} label="Power Outage" />

              {/* Resource markers with movement lines */}
              <ResourceWithPath x={25} y={40} targetX={20} targetY={25} />
              <ResourceWithPath x={60} y={45} targetX={45} targetY={55} />
              <ResourceWithPath x={80} y={50} targetX={70} targetY={35} />

              {/* Pulse rings around critical incident */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: '20%', top: '25%' }}
              >
                <div className="absolute inset-0 h-16 w-16 -m-8 bg-severity-critical/20 rounded-full animate-ping" />
              </div>
            </div>

            {/* Footer stats */}
            <div className="flex items-center justify-between border-t-2 border-foreground px-4 py-3 bg-command-bg">
              <div className="flex items-center gap-6">
                <StatItem icon={<AlertTriangle className="h-4 w-4" />} value="4" label="Active Incidents" />
                <StatItem icon={<Truck className="h-4 w-4" />} value="3" label="Responding Units" />
                <StatItem icon={<Clock className="h-4 w-4" />} value="1.8min" label="Avg Response" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-status-active rounded-full animate-pulse" />
                <span className="font-mono text-xs text-status-active">LIVE</span>
              </div>
            </div>
          </div>

          {/* Floating info cards */}
          <div className="absolute -right-4 top-20 hidden lg:block animate-fade-in" style={{ animationDelay: '500ms' }}>
            <div className="border-2 border-foreground bg-card p-3 shadow-lg max-w-xs">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-severity-critical flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-background" />
                </div>
                <div>
                  <div className="font-mono text-xs text-severity-critical">CRITICAL ALERT</div>
                  <div className="text-sm font-medium">Structure Fire - 742 Evergreen</div>
                  <div className="text-xs text-muted-foreground mt-1">Engine 7 responding • ETA 2 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegendItem({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 ${color} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function AnimatedIncident({ x, y, severity, delay, label }: { x: number; y: number; severity: string; delay: number; label: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-severity-critical',
    high: 'bg-severity-high',
    medium: 'bg-severity-medium',
    low: 'bg-severity-low',
  };

  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer animate-fade-in"
      style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay * 200}ms` }}
    >
      <div className={`h-8 w-8 ${colors[severity]} border-2 border-foreground flex items-center justify-center transition-transform hover:scale-110`}>
        <AlertTriangle className="h-4 w-4 text-background" />
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-card border-2 border-foreground px-2 py-1 text-xs font-medium z-10">
        {label}
      </div>
    </div>
  );
}

function ResourceWithPath({ x, y, targetX, targetY }: { x: number; y: number; targetX: number; targetY: number }) {
  return (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line 
          x1={`${x}%`} y1={`${y}%`} 
          x2={`${targetX}%`} y2={`${targetY}%`} 
          className="stroke-command-accent/50" 
          strokeWidth="2" 
          strokeDasharray="6 4"
        >
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
        </line>
      </svg>
      <div 
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <div className="h-6 w-6 bg-status-active border-2 border-foreground flex items-center justify-center">
          <Truck className="h-3 w-3 text-background" />
        </div>
      </div>
    </>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-command-accent">{icon}</span>
      <span className="font-mono text-sm text-primary-foreground font-semibold">{value}</span>
      <span className="font-mono text-xs text-muted-foreground hidden md:inline">{label}</span>
    </div>
  );
}
