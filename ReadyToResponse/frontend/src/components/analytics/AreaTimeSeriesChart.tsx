import { ChartCard } from './ChartCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';


export function AreaTimeSeriesChart({ data }: any) {
  return (
    <ChartCard title="Incident Volume Over Time">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <XAxis dataKey="date"/>
          <YAxis/>
          <Tooltip/>
          <Area dataKey="incidents" stroke="hsl(199,89%,48%)" fillOpacity={0.3} fill="hsl(199,89%,48%)"/>
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
