import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Package, BarChart3, LogOut, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { ChatPanel } from '@/components/chat/chatPanel';

const navItems = [
  {
    path: '/dashboard',
    label: 'Command',
    icon: Radio,
  },
  {
    path: '/incidents',
    label: 'Incidents',
    icon: AlertTriangle,
  },
  {
    path: '/resources',
    label: 'Resources',
    icon: Package,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
];

export function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'coordinator':
        return 'COORDINATOR';
      case 'agency':
        return 'AGENCY';
      default:
        return 'COMMUNITY';
    }
  };

  // Chat is only available to Agency and Coordinator users
  const canAccessChat = user?.role === 'agency' || user?.role === 'coordinator' || user?.role === 'community';

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-foreground">
              <Radio className="h-5 w-5 text-background" />
            </div>
            <div className="hidden sm:block">
              <span className="font-mono text-xs tracking-wider text-muted-foreground">
                READY RESPONSE OPS
              </span>
              <h1 className="text-lg font-bold tracking-tight">COMMAND CENTER</h1>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'hover:bg-secondary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications - visible to all roles */}
          <NotificationPanel />

          {/* Chat - only visible to Agency and Coordinator */}
          {canAccessChat && <ChatPanel />}

          <div className="hidden sm:flex flex-col items-end ml-2">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="font-mono text-xs tracking-wider text-muted-foreground">
              {getRoleBadge()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-2 border-foreground font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}