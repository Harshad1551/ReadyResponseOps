import { HeroSection } from '@/components/landing/HeroSection';
import { LiveMapPreview } from '@/components/landing/LiveMapPreview';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { RoleCards } from '@/components/landing/RoleCards';
import { SmartAutomation } from '@/components/landing/SmartAutomation';
import { AlertsPreview } from '@/components/landing/AlertsPreview';
import { VoiceReporting } from '@/components/landing/VoiceReporting';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-command-bg/80 backdrop-blur-md border-b-2 border-foreground">
        <div className="container px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-severity-critical flex items-center justify-center">
              <span className="text-background font-bold text-sm">RRO</span>
            </div>
            <span className="font-semibold text-primary-foreground tracking-tight">
              Ready Response Ops
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-command-accent text-command-accent hover:bg-command-accent hover:text-primary-foreground"
            asChild
          >
            <Link to="/auth">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </div>
      </nav>

      {/* Page sections */}
      <HeroSection />
      <LiveMapPreview />
      <HowItWorks />
      <RoleCards />
      <SmartAutomation />
      <AlertsPreview />
      <VoiceReporting />
      <FinalCTA />

      {/* Footer */}
      <footer className="border-t-2 border-foreground bg-command-bg py-8">
        <div className="container px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-6 w-6 bg-severity-critical flex items-center justify-center">
              <span className="text-background font-bold text-xs">CN</span>
            </div>
            <span className="font-semibold text-primary-foreground text-sm">
              Ready Response Ops
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ready Response Ops. Built for communities, responders, and coordinators.
          </p>
        </div>
      </footer>
    </div>
  );
}
