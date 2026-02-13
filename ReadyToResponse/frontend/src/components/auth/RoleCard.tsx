import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
}

export function RoleCard({
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-start gap-4 border-2 p-6 text-left transition-all duration-200',
        selected
          ? 'border-foreground bg-foreground text-background shadow-md translate-x-1 translate-y-1'
          : 'border-foreground bg-card hover:bg-secondary hover:translate-x-1 hover:translate-y-1 hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 items-center justify-center border-2',
          selected
            ? 'border-background bg-background text-foreground'
            : 'border-foreground bg-foreground text-background'
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        <p
          className={cn(
            'mt-1 text-sm',
            selected ? 'text-background/80' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>
      </div>
      <div
        className={cn(
          'absolute right-4 top-4 h-5 w-5 border-2 transition-colors',
          selected
            ? 'border-background bg-background'
            : 'border-foreground bg-transparent'
        )}
      >
        {selected && (
          <svg
            className="h-full w-full text-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
