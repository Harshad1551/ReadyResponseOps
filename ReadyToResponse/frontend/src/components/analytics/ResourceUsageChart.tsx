import { ChartCard } from './ChartCard';
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Cell
} from 'recharts';

const resourceColors: Record<string, string> = {
  Ambulance: "#ff00aa",
  "Fire Truck": "#ef4444",
  Police: "#6366f1",
  "Helicopter": "#22c55e",
  HazMat: "#fbf600"
};

export function ResourceUsageChart({ data }: any) {
  return (
    <ChartCard title="Resource Usage">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} />
          <YAxis type="category" dataKey="type" />
          <Tooltip />

          <Bar dataKey="usage">
            {data.map((entry: any, index: number) => (
              <Cell
                key={index}
                fill={
                  resourceColors[entry.type] ||
                  "hsl(199,89%,48%)"
                }
              />
            ))}
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
