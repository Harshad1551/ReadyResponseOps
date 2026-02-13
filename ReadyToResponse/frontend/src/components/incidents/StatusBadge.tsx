import { cn } from '@/lib/utils';
import { IncidentStatus } from '@/types';

interface StatusBadgeProps {
  status?: IncidentStatus; // 👈 allow undefined safely
  className?: string;
}

const statusConfig: Record<
  IncidentStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'ACTIVE',
    className: 'bg-status-active text-background',
  },
  pending: {
    label: 'PENDING',
    className: 'bg-status-pending text-foreground',
  },
  resolved: {
    label: 'RESOLVED',
    className: 'bg-status-resolved text-background',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // ✅ HARD GUARD — prevents runtime crash
  if (!status || !statusConfig[status]) {
    return null;
  }

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
