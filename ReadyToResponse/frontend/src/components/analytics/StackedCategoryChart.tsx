import { ChartCard } from './ChartCard';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function StackedCategoryChart({ incidents }: any) {

  const weekly = Object.values(
    incidents.reduce((acc:any,i:any)=>{
      const week = new Date(i.created_at).toLocaleDateString();
      acc[week] = acc[week] || { period: week };
      acc[week][i.category] = (acc[week][i.category] || 0) + 1;
      return acc;
    },{})
  );

  return (
    <ChartCard title="Category Trends">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={weekly}>
          <XAxis dataKey="period"/>
          <YAxis/>
          <Tooltip/>
          {Object.keys(weekly[0] || {}).filter(k=>k!=="period").map((cat,i)=>(
            <Bar key={i} dataKey={cat} stackId="a" fill={`hsl(${i*60},70%,55%)`}/>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
