import { Mic, Zap, Truck, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  return (
    <section className="py-20 bg-background relative">
      <div className="container px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From incident report to resource deployment in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <StepCard
            step={1}
            icon={<Mic className="h-8 w-8" />}
            title="Report Incident"
            description="Submit reports instantly via form or voice input. Speak naturally and let AI extract critical details automatically."
            color="text-command-accent"
            bgColor="bg-command-accent/10"
            borderColor="border-command-accent/30"
          />
          
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
          </div>
          
          <StepCard
            step={2}
            icon={<Zap className="h-8 w-8" />}
            title="Automatic Prioritization"
            description="The system analyzes severity, location, and available resources to prioritize and alert the right responders."
            color="text-severity-high"
            bgColor="bg-severity-high/10"
            borderColor="border-severity-high/30"
          />
          
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
          </div>
          
          <StepCard
            step={3}
            icon={<Truck className="h-8 w-8" />}
            title="Live Response Tracking"
            description="Track assigned resources in real-time on the map. Monitor response progress until incident resolution."
            color="text-status-active"
            bgColor="bg-status-active/10"
            borderColor="border-status-active/30"
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({ 
  step, 
  icon, 
  title, 
  description, 
  color, 
  bgColor, 
  borderColor 
}: { 
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`relative border-2 border-foreground bg-card p-6 transition-transform hover:-translate-y-1 hover:shadow-lg`}>
      {/* Step number */}
      <div className="absolute -top-4 -left-4 h-8 w-8 bg-foreground text-background flex items-center justify-center font-mono font-bold text-sm">
        {step}
      </div>

      {/* Icon */}
      <div className={`inline-flex items-center justify-center h-16 w-16 ${bgColor} border ${borderColor} mb-4`}>
        <span className={color}>{icon}</span>
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
