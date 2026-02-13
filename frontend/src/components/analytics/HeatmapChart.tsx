import { ChartCard } from './ChartCard';

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const timeBlocks = [
  { label: "Night", start: 0, end: 3 },
  { label: "Early AM", start: 4, end: 7 },
  { label: "Morning", start: 8, end: 11 },
  { label: "Afternoon", start: 12, end: 15 },
  { label: "Evening", start: 16, end: 19 },
  { label: "Late Night", start: 20, end: 23 },
];

export function HeatmapChart({ incidents }: any) {

  const heatmap: any = {};

  incidents.forEach((i: any) => {
    if (!i.created_at) return;

    const date = new Date(i.created_at);
    const hour = date.getHours();
    const day = days[date.getDay()];

    const block = timeBlocks.find(
      b => hour >= b.start && hour <= b.end
    );

    if (!block) return;

    heatmap[block.label] ||= {};
    heatmap[block.label][day] =
      (heatmap[block.label][day] || 0) + 1;
  });

  const rows = timeBlocks.map(block => ({
    block: block.label,
    ...days.reduce((acc: any, d) => {
      acc[d] = heatmap[block.label]?.[d] || 0;
      return acc;
    }, {})
  }));

  const maxValue = Math.max(
    ...rows.flatMap(r => days.map(d => r[d]))
  );

  const getColor = (value: number) => {
    if (value === 0) return "bg-muted";
    const intensity = value / maxValue;

    if (intensity < 0.25) return "bg-chart-2/30";
    if (intensity < 0.5) return "bg-chart-3/50";
    if (intensity < 0.75) return "bg-chart-3/80";
    return "bg-chart-4/90";
  };

  return (
    <ChartCard 
      title="Incident Density by Time of Day"
      description="Patterns across daily time blocks"
    >
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">

          {/* Header */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div></div>
            {days.map(d => (
              <div key={d} className="text-xs text-center text-muted-foreground font-mono">
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap */}
          {rows.map(row => (
            <div key={row.block} className="grid grid-cols-8 gap-1 mb-1">

              <div className="text-xs text-muted-foreground font-mono flex items-center">
                {row.block}
              </div>

              {days.map(day => (
                <div
                  key={day}
                  className={`h-8 rounded-sm flex items-center justify-center ${getColor(row[day])}`}
                  title={`${day} • ${row.block}: ${row[day]} incidents`}
                >
                  <span className="text-xs font-mono text-foreground/70">
                    {row[day]}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="flex justify-end gap-2 mt-4 text-xs text-muted-foreground items-center">
            <span>Low</span>
            <div className="w-4 h-4 bg-muted rounded-sm"/>
            <div className="w-4 h-4 bg-chart-2/30 rounded-sm"/>
            <div className="w-4 h-4 bg-chart-3/50 rounded-sm"/>
            <div className="w-4 h-4 bg-chart-3/80 rounded-sm"/>
            <div className="w-4 h-4 bg-chart-4/90 rounded-sm"/>
            <span>High</span>
          </div>

        </div>
      </div>
    </ChartCard>
  );
}
