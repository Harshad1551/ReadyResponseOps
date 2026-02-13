import { Bell, MessageSquare, AlertTriangle, Truck, Users } from 'lucide-react';

export function AlertsPreview() {
  return (
    <section className="py-20 bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 map-grid" />
      
      <div className="container relative z-10 px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-severity-high/30 bg-severity-high/10 text-severity-high font-mono text-xs">
            <Bell className="h-3 w-3" />
            INSTANT COMMUNICATION
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Real-Time Alerts & Coordination
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Stay informed with instant notifications and coordinate seamlessly with built-in team chat
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Notifications preview */}
          <div className="border-2 border-foreground bg-card shadow-xl">
            <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 bg-command-bg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary-foreground" />
                <span className="font-mono text-xs text-primary-foreground">NOTIFICATIONS</span>
              </div>
              <div className="flex items-center justify-center h-5 w-5 bg-severity-critical text-background text-xs font-bold rounded-full">
                3
              </div>
            </div>

            <div className="divide-y-2 divide-border">
              <NotificationItem
                icon={<AlertTriangle className="h-4 w-4" />}
                iconBg="bg-severity-critical"
                title="New Critical Incident"
                description="Structure fire reported at 742 Evergreen Terrace"
                time="2 min ago"
                unread
              />
              <NotificationItem
                icon={<Truck className="h-4 w-4" />}
                iconBg="bg-status-active"
                title="Resource Assigned"
                description="Engine 7 assigned to Medical Emergency"
                time="15 min ago"
                unread
              />
              <NotificationItem
                icon={<Users className="h-4 w-4" />}
                iconBg="bg-command-accent"
                title="New Resource Available"
                description="Ambulance Unit 12 now online"
                time="45 min ago"
              />
            </div>
          </div>

          {/* Chat preview */}
          <div className="border-2 border-foreground bg-card shadow-xl">
            <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3 bg-command-bg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
                <span className="font-mono text-xs text-primary-foreground">TEAM COORDINATION</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-status-active rounded-full" />
                <span className="font-mono text-xs text-muted-foreground">3 online</span>
              </div>
            </div>

            <div className="p-4 space-y-4 h-64 overflow-hidden">
              <ChatMessage
                sender="Cpt. Rodriguez"
                role="Agency"
                message="Engine 7 is 2 minutes out from the Evergreen location."
                time="14:32"
                isOwn={false}
              />
              <ChatMessage
                sender="Dispatch Lead"
                role="Coordinator"
                message="Copy that. Ambulance Unit 5 is en route as backup. ETA 5 minutes."
                time="14:33"
                isOwn
              />
              <ChatMessage
                sender="Cpt. Rodriguez"
                role="Agency"
                message="Confirmed. Will update on scene assessment."
                time="14:34"
                isOwn={false}
              />
            </div>

            <div className="border-t-2 border-foreground p-3">
              <div className="flex items-center gap-2 bg-secondary border border-border px-3 py-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  disabled
                />
                <div className="h-6 w-6 bg-command-accent flex items-center justify-center">
                  <MessageSquare className="h-3 w-3 text-background" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotificationItem({ 
  icon, 
  iconBg, 
  title, 
  description, 
  time, 
  unread 
}: { 
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 ${unread ? 'bg-muted/50' : ''}`}>
      <div className={`h-8 w-8 ${iconBg} flex items-center justify-center flex-shrink-0 text-background`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm">{title}</span>
          {unread && <div className="h-2 w-2 bg-command-accent rounded-full" />}
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
    </div>
  );
}

function ChatMessage({ 
  sender, 
  role, 
  message, 
  time, 
  isOwn 
}: { 
  sender: string;
  role: string;
  message: string;
  time: string;
  isOwn: boolean;
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'bg-command-accent/20 border-command-accent/30' : 'bg-secondary border-border'} border p-3`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground text-sm">{sender}</span>
          <span className="font-mono text-xs text-muted-foreground">• {role}</span>
        </div>
        <p className="text-sm text-foreground">{message}</p>
        <span className="text-xs text-muted-foreground block text-right mt-1">{time}</span>
      </div>
    </div>
  );
}
