import { Truck, MapPin, Check } from 'lucide-react';
import { Resource } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ResourceCardProps {
  resource: Resource;
  canEditStatus?: boolean;
  onStatusChange?: (status: 'Available' | 'Engaged' | 'Unavailable') => void;
  onClick?: () => void;
}

const statusStyles = {
  Available: 'border-status-active',
  Engaged: 'border-status-pending',
  Unavailable: 'border-status-resolved',
};

const statusLabels = {
  Available: 'AVAILABLE',
  Engaged: 'ENGAGED',
  Unavailable: 'UNAVAILABLE',
};

const STATUSES: Array<'Available' | 'Engaged' | 'Unavailable'> = [
  'Available',
  'Engaged',
  'Unavailable',
];

export function ResourceCard({
  resource,
  canEditStatus,
  onStatusChange,
  onClick,
}: ResourceCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={cn(
        'w-full cursor-pointer text-left border-2 bg-card p-4 transition-all duration-200 hover:bg-secondary hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-sm',
        statusStyles[resource.status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center border-2 border-foreground',
              resource.status === 'Available'
                ? 'bg-status-active'
                : 'bg-secondary'
            )}
          >
            <Truck
              className={cn(
                'h-5 w-5',
                resource.status === 'Available'
                  ? 'text-background'
                  : 'text-foreground'
              )}
            />
          </div>

          <div>
            <h3 className="font-bold">{resource.name}</h3>
            <p className="text-sm text-muted-foreground">{resource.type}</p>
          </div>
        </div>

        {/* STATUS BADGE / DROPDOWN */}
        {canEditStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'cursor-pointer px-2 py-0.5 font-mono text-xs font-bold tracking-wider',
                  resource.status === 'Available' &&
                    'bg-status-active text-background',
                  resource.status === 'Engaged' &&
                    'bg-status-pending text-foreground',
                  resource.status === 'Unavailable' &&
                    'bg-status-resolved text-background'
                )}
              >
                {statusLabels[resource.status]}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              {STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange?.(status)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        status === 'Available' && 'bg-status-active',
                        status === 'Engaged' && 'bg-status-pending',
                        status === 'Unavailable' && 'bg-status-resolved'
                      )}
                    />
                    {status}
                  </span>

                  {resource.status === status && (
                    <Check className="h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            className={cn(
              'px-2 py-0.5 font-mono text-xs font-bold tracking-wider',
              resource.status === 'Available' &&
                'bg-status-active text-background',
              resource.status === 'Engaged' &&
                'bg-status-pending text-foreground',
              resource.status === 'Unavailable' &&
                'bg-status-resolved text-background'
            )}
          >
            {statusLabels[resource.status]}
          </span>
        )}
      </div>

      {resource.assignedTo && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>Assigned to Incident #{resource.assignedTo}</span>
        </div>
      )}
    </div>
  );
}
