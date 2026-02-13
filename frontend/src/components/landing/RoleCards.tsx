import { Users, Shield, Radio } from 'lucide-react';

export function RoleCards() {
  return (
    <section className="py-20 bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--command-accent)/0.05),transparent_70%)]" />
      
      <div className="container relative z-10 px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Built for Every Role
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Purpose-built experiences for communities, responders, and coordinators
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <RoleCard
            icon={<Users className="h-10 w-10" />}
            role="Community Users"
            tagline="Report & Request Help"
            features={[
              "Submit incidents via form or voice",
              "Track reported incident status",
              "Request emergency assistance",
              "Receive safety notifications"
            ]}
            accentColor="text-command-accent"
            accentBg="bg-command-accent"
          />
          
          <RoleCard
            icon={<Shield className="h-10 w-10" />}
            role="Agency Users"
            tagline="Manage & Deploy"
            features={[
              "View all active incidents",
              "Manage emergency resources",
              "Resolve verified incidents",
              "Access resource analytics"
            ]}
            accentColor="text-status-active"
            accentBg="bg-status-active"
            featured
          />
          
          <RoleCard
            icon={<Radio className="h-10 w-10" />}
            role="Coordinators"
            tagline="Assign & Oversee"
            features={[
              "Assign resources to incidents",
              "Coordinate inter-agency response",
              "Real-time team communication",
              "Monitor system-wide operations"
            ]}
            accentColor="text-severity-high"
            accentBg="bg-severity-high"
          />
        </div>
      </div>
    </section>
  );
}

function RoleCard({ 
  icon, 
  role, 
  tagline, 
  features, 
  accentColor, 
  accentBg,
  featured 
}: { 
  icon: React.ReactNode;
  role: string;
  tagline: string;
  features: string[];
  accentColor: string;
  accentBg: string;
  featured?: boolean;
}) {
  return (
    <div className={`relative border-2 border-foreground bg-card transition-transform hover:-translate-y-2 hover:shadow-xl ${featured ? 'md:-translate-y-2' : ''}`}>
      {/* Accent top bar */}
      <div className={`h-1.5 ${accentBg}`} />
      
      <div className="p-6">
        {/* Icon and role */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`${accentColor}`}>{icon}</div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{role}</h3>
            <p className={`text-sm font-mono ${accentColor}`}>{tagline}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-4" />

        {/* Features list */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className={`h-1.5 w-1.5 ${accentBg} mt-2 flex-shrink-0`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-foreground text-background font-mono text-xs">
          PRIMARY RESPONDER
        </div>
      )}
    </div>
  );
}
