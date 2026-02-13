import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-command-bg via-command-surface to-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--command-accent)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 opacity-20 map-grid" />
      
      <div className="container relative z-10 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-command-accent/30 bg-command-accent/10 text-command-accent font-mono text-sm">
            <Shield className="h-4 w-4" />
            JOIN THE NETWORK
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight">
            Ready to Transform<br />Crisis Response?
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join communities, agencies, and coordinators already using Ready Response Ops 
            to respond faster and save lives.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-command-accent hover:bg-command-accent/90 text-primary-foreground border-2 border-command-accent font-semibold px-8"
              asChild
            >
              <Link to="/auth">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}

function TrustItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-lg font-bold text-primary-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
