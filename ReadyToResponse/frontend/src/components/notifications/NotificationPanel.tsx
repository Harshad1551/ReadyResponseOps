import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Package, Link2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import { socket } from '@/lib/socket';
import { Notification } from '@/types';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'incident_reported':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'resource_added':
      return <Package className="h-4 w-4 text-primary" />;
    case 'resource_assigned':
      return <Link2 className="h-4 w-4 text-chart-4" />;
    case 'incident_resolved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth(); // Need user to join socket rooms

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Connect and Join rooms
      if (!socket.connected) socket.connect();
      socket.emit('join', { userId: user.id, role: user.role });

      // Listen for new notifications
      socket.on('notification:new', (newNotification: Notification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Optional: Play sound or show toast
      });

      return () => {
        socket.off('notification:new');
      };
    }
  }, [user]);

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Mark all as read when panel opens (or maybe just visually for now?)
      // User requirement usually implies marking read when seen.
      // Let's mark all read on open for simplicity, or we can do it per item.
      // For now, let's call API to mark all read if there are unread items.
      try {
        await notificationService.markAllAsRead();
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark all read", err);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 border-2 border-foreground"
        sideOffset={8}
      >
        <div className="border-b-2 border-foreground bg-muted/50 px-4 py-3">
          <h3 className="font-mono text-xs tracking-wider text-muted-foreground">
            NOTIFICATIONS
          </h3>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 px-4 py-3 transition-colors',
                    !notification.read && 'bg-accent/30'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {notification.message}
                    </p>
                    {/* Accessing data properties safely if they exist */}
                    {notification.data && notification.data.incidentCategory && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        Category: {notification.data.incidentCategory}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
