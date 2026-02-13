interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'high' | 'success';
}

export function StatCard({
  label,
  value,
  variant = 'default'
}: StatCardProps) {

  const border: any = {
    default: 'border-foreground',
    high: 'border-severity-high',
    success: 'border-status-active'
  };

  const text: any = {
    default: '',
    high: 'text-severity-high',
    success: 'text-status-active'
  };

  return (
    <div className={`border-2 ${border[variant]} bg-card p-5`}>
      <span className={`text-xs font-mono ${text[variant] || 'text-muted-foreground'}`}>
        {label}
      </span>
      <div className={`text-3xl font-bold ${text[variant]}`}>
        {value ?? 0}
      </div>
    </div>
  );
}
