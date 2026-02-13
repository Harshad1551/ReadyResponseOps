import { Brain, BarChart3, TrendingUp, Target } from 'lucide-react';

export function SmartAutomation() {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="container px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-command-accent/30 bg-command-accent/10 text-command-accent font-mono text-xs">
                <Brain className="h-3 w-3" />
                INTELLIGENT AUTOMATION
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Smart Systems, Better Outcomes
              </h2>
              <p className="text-muted-foreground">
                Reduce cognitive load during emergencies with automated prioritization, 
                resource recommendations, and predictive analytics.
              </p>
            </div>

            <div className="space-y-4">
              <FeatureItem
                icon={<Target className="h-5 w-5" />}
                title="Automatic Incident Prioritization"
                description="AI analyzes severity, location, and context to surface the most critical incidents first."
              />
              <FeatureItem
                icon={<BarChart3 className="h-5 w-5" />}
                title="Resource Utilization Tracking"
                description="Real-time visibility into resource deployment, availability, and historical efficiency."
              />
              <FeatureItem
                icon={<TrendingUp className="h-5 w-5" />}
                title="Crisis Pattern Insights"
                description="Identify recurring hotspots, peak hours, and incident trends to improve preparedness."
              />
            </div>
          </div>

          {/* Right analytics preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-command-accent/10 blur-3xl rounded-3xl" />
            <AnalyticsMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 border-2 border-border bg-card hover:border-command-accent/30 transition-colors">
      <div className="flex-shrink-0 h-10 w-10 bg-command-accent/10 border border-command-accent/30 flex items-center justify-center text-command-accent">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="relative border-2 border-foreground bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 bg-command-bg">
        <span className="font-mono text-xs text-primary-foreground">CRISIS ANALYTICS</span>
        <span className="font-mono text-xs text-command-accent">LIVE</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Resolved Today" value="12" trend="+3" positive />
          <StatBox label="Avg Response" value="1.8m" trend="-0.4m" positive />
          <StatBox label="Active Now" value="4" />
        </div>

        {/* Chart mockup */}
        <div className="border border-border bg-secondary p-4">
          <div className="flex items-end justify-between h-32 gap-2">
            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((height, i) => (
              <div 
                key={i} 
                className="flex-1 bg-command-accent/60 hover:bg-command-accent transition-colors"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 font-mono text-xs text-muted-foreground">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Gauge mockup */}
        <div className="flex items-center gap-4 p-3 border border-border bg-secondary">
          <div className="relative h-16 w-16">
            <svg className="transform -rotate-90 h-16 w-16">
              <circle cx="32" cy="32" r="28" className="fill-none stroke-muted stroke-4" />
              <circle 
                cx="32" cy="32" r="28" 
                className="fill-none stroke-status-active stroke-4" 
                strokeDasharray="176"
                strokeDashoffset="44"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-foreground">
              75%
            </div>
          </div>
          <div>
            <div className="font-semibold text-foreground">Resource Utilization</div>
            <div className="text-xs text-muted-foreground">18 of 24 units deployed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, trend, positive }: { label: string; value: string; trend?: string; positive?: boolean }) {
  return (
    <div className="p-3 border border-border bg-secondary text-center">
      <div className="font-mono text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {trend && (
        <div className={`text-xs font-mono mt-1 ${positive ? 'text-status-active' : 'text-severity-high'}`}>
          {trend}
        </div>
      )}
    </div>
  );
}
