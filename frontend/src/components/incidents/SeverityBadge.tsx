import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string; // coming directly from backend
  className?: string;
  pulse?: boolean;
}

/* Backend allows: 'Low' | 'Medium' | 'High' */
const severityConfig: Record<
  "low" | "medium" | "high",
  { label: string; className: string }
> = {
  low: {
    label: "LOW",
    className: "bg-severity-low text-background",
  },
  medium: {
    label: "MEDIUM",
    className: "bg-severity-medium text-foreground",
  },
  high: {
    label: "HIGH",
    className: "bg-severity-high text-background",
  },
};

export function SeverityBadge({
  severity,
  className,
  pulse,
}: SeverityBadgeProps) {
  // normalize backend value (Low → low)
  const normalizedSeverity = severity?.toLowerCase() as
    | "low"
    | "medium"
    | "high";

  const config = severityConfig[normalizedSeverity];

  // 🚑 Safety guard — never crash UI
  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider bg-muted text-muted-foreground",
          className
        )}
      >
        UNKNOWN
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider",
        config.className,
        pulse && "animate-pulse",
        className
      )}
    >
      {config.label}
    </span>
  );
}