import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className = ''
}: ChartCardProps) {
  return (
    <div className={`border-2 border-foreground bg-card p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
