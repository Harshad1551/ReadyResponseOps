import { Mic, FileText, Zap, CheckCircle } from 'lucide-react';

export function VoiceReporting() {
  return (
    <section className="py-20 bg-background relative">
      <div className="container px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Voice UI mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 bg-severity-critical/10 blur-3xl rounded-3xl" />
            <VoiceMockup />
          </div>

          {/* Right content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-severity-critical/30 bg-severity-critical/10 text-severity-critical font-mono text-xs">
                <Mic className="h-3 w-3" />
                VOICE-ASSISTED REPORTING
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Report Incidents by Voice
              </h2>
              <p className="text-muted-foreground">
                In high-stress emergencies, typing is slow. Speak naturally and let AI extract 
                the critical details—incident type, severity, location—automatically.
              </p>
            </div>

            <div className="space-y-4">
              <BenefitItem
                icon={<Mic className="h-5 w-5" />}
                title="Natural Speech Input"
                description="Describe the emergency in your own words. No forms to navigate."
              />
              <BenefitItem
                icon={<Zap className="h-5 w-5" />}
                title="Instant Field Extraction"
                description="AI identifies incident type, severity, and location from your description."
              />
              <BenefitItem
                icon={<CheckCircle className="h-5 w-5" />}
                title="Review Before Submit"
                description="Verify auto-filled fields and correct anything before submitting."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-10 w-10 bg-severity-critical/10 border border-severity-critical/30 flex items-center justify-center text-severity-critical">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function VoiceMockup() {
  return (
    <div className="relative border-2 border-foreground bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 bg-command-bg">
        <span className="font-mono text-xs text-primary-foreground">REPORT INCIDENT</span>
        <span className="font-mono text-xs text-status-active">VOICE MODE</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Voice input area */}
        <div className="text-center space-y-4">
          <div className="relative inline-flex">
            {/* Pulse rings */}
            <div className="absolute inset-0 bg-severity-critical/20 rounded-full animate-ping" />
            <div className="absolute inset-2 bg-severity-critical/30 rounded-full animate-pulse" />
            {/* Mic button */}
            <div className="relative h-20 w-20 bg-severity-critical rounded-full flex items-center justify-center cursor-pointer hover:bg-severity-critical/90 transition-colors">
              <Mic className="h-8 w-8 text-background" />
            </div>
          </div>
          <div className="font-mono text-sm text-muted-foreground">Listening...</div>
        </div>

        {/* Transcription */}
        <div className="p-4 bg-secondary border border-border">
          <div className="text-xs text-muted-foreground font-mono mb-2">TRANSCRIPTION</div>
          <p className="text-foreground text-sm italic">
            "There's a fire at the abandoned warehouse on Oak Street, near the intersection 
            with Main. Smoke is visible and spreading fast. No one appears to be inside."
          </p>
        </div>

        {/* Auto-filled fields */}
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
            <Zap className="h-3 w-3 text-command-accent" />
            AI-EXTRACTED FIELDS
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <ExtractedField label="Type" value="Structure Fire" confidence={95} />
            <ExtractedField label="Severity" value="Critical" confidence={92} />
            <ExtractedField label="Location" value="Oak St & Main" confidence={88} />
            <ExtractedField label="Casualties" value="None reported" confidence={85} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <div className="flex-1 py-2 border-2 border-border text-center font-medium text-muted-foreground text-sm">
            Re-record
          </div>
          <div className="flex-1 py-2 bg-status-active border-2 border-status-active text-center font-medium text-background text-sm">
            Submit Report
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtractedField({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  return (
    <div className="p-3 bg-command-accent/5 border border-command-accent/20">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs text-command-accent font-mono">{confidence}%</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
