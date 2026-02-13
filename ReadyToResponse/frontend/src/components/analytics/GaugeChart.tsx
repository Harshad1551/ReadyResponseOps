import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartCard } from './ChartCard';

interface GaugeChartProps {
  value: number;
  label: string;
}

export function GaugeChart({ value, label }: GaugeChartProps) {

  const safeValue = Math.min(100, Math.max(0, value));

  const data = [
    { name: 'used', value: safeValue },
    { name: 'free', value: 100 - safeValue }
  ];

  const getColor = () => {
    if (safeValue < 40) return 'hsl(142,71%,45%)';
    if (safeValue < 70) return 'hsl(45,93%,47%)';
    return 'hsl(0,72%,51%)';
  };

  const color = getColor();

  return (
    <ChartCard title={label}>
      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="75%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="hsl(220,15%,92%)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
          <span className="text-4xl font-bold">{safeValue}%</span>
          <span className="text-sm text-muted-foreground">utilized</span>
        </div>
      </div>
    </ChartCard>
  );
}
