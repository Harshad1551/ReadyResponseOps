import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from "@/context/AuthContext";

import { StatCard } from '@/components/analytics/StatCard';
import { ChartCard } from '@/components/analytics/ChartCard';
import { HeatmapChart } from '@/components/analytics/HeatmapChart';
import { StackedCategoryChart } from '@/components/analytics/StackedCategoryChart';
import { AreaTimeSeriesChart } from '@/components/analytics/AreaTimeSeriesChart';
import { GaugeChart } from '@/components/analytics/GaugeChart';
import { ResourceUsageChart } from '@/components/analytics/ResourceUsageChart';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

type Period = 'weekly' | 'monthly' | 'yearly';

/* ---------- COLOR SYSTEM ---------- */

const severityColors: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444"
};

const categoryColors: Record<string, string> = {
  Fire: "#ef4444",
  Medical: "#22c55e",
  Flooding: "#6366f1",
  "Power Outage": "#f97316",
  "Gas Leak": "#a855f7",
  Other: "#94a3b8"
};

export default function AnalyticsPage() {
  const { token } = useAuth();

  const [period, setPeriod] = useState<Period>('monthly');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    Promise.all([fetchIncidents(), fetchResources()])
      .finally(() => setLoading(false));
  }, [token]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // ---------------- FETCH ----------------

  const fetchIncidents = async () => {
    try {
      const res = await fetch(
        'http://localhost:5000/incidents/incident-detail',
        { headers: authHeaders }
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setIncidents(Array.isArray(data.incidents) ? data.incidents : []);
    } catch {
      setIncidents([]);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('http://localhost:5000/resources', {
        headers: authHeaders
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setResources(Array.isArray(data) ? data : data.resources || []);
    } catch {
      setResources([]);
    }
  };

  // ---------------- INCIDENT PROCESSING ----------------

  const filteredIncidents = incidents.filter(i => {
    if (!i.created_at) return false;
    const date = new Date(i.created_at);
    const now = new Date();

    if (period === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return date >= oneWeekAgo;
    }
    if (period === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return date >= oneMonthAgo;
    }
    if (period === 'yearly') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return date >= oneYearAgo;
    }
    return true;
  });

  const severityDistribution = Object.values(
    filteredIncidents.reduce((acc: any, i: any) => {
      if (!i.severity) return acc;

      const key = String(i.severity).trim().toLowerCase();

      acc[key] ||= { severity: key, count: 0 };
      acc[key].count++;

      return acc;
    }, {})
  );

  const categoryDistribution = Object.values(
    filteredIncidents.reduce((acc: any, i: any) => {
      if (!i.category) return acc;

      acc[i.category] ||= { category: i.category, count: 0 };
      acc[i.category].count++;

      return acc;
    }, {})
  );

  const timeSeries = Object.values(
    filteredIncidents.reduce((acc: any, i: any) => {
      if (!i.created_at) return acc;

      const date = new Date(i.created_at).toLocaleDateString();
      acc[date] ||= { date, incidents: 0 };
      acc[date].incidents++;

      return acc;
    }, {})
  );

  const totalIncidents = filteredIncidents.length;

  const resolvedCount = filteredIncidents.filter(i => i.status === 'resolved').length;
  const resolutionRate = totalIncidents ? Math.round((resolvedCount / totalIncidents) * 100) : 0;

  // ---------------- RESOURCE PROCESSING ----------------

  const resourceGrouped = Object.values(
    resources.reduce((acc: any, r: any) => {
      if (!r.type) return acc;

      acc[r.type] ||= { type: r.type, engaged: 0, total: 0 };
      acc[r.type].total++;

      if (r.status === 'Engaged') acc[r.type].engaged++;

      return acc;
    }, {})
  ).map((r: any) => ({
    ...r,
    usage: r.total ? Math.round((r.engaged / r.total) * 100) : 0
  }));

  const overallUsage = resources.length
    ? Math.round(
      (resources.filter(r => r.status === 'Engaged').length /
        resources.length) *
      100
    )
    : 0;

  // ---------------- PIE DATA ----------------

  const severityData = severityDistribution.map((s: any) => ({
    ...s,
    name: s.severity.toUpperCase(),
    fill: severityColors[s.severity]
  }));

  if (!token || loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">
          Loading analytics…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Live crisis insights
            </p>
          </div>

          <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
            <TabsList className="border-2 border-foreground bg-secondary">
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="TOTAL INCIDENTS" value={totalIncidents} />

          <StatCard
            label="HIGH"
            value={
              severityDistribution.find(
                (s: any) => s.severity === 'high'
              )?.count || 0
            }
            variant="high"
          />

          <StatCard label="RESOLUTION RATE" value={`${resolutionRate}%`} variant="success" />
        </div>

        {/* INCIDENT TREND */}
        <ChartCard title="Incident Trends">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  dataKey="incidents"
                  stroke="hsl(199,89%,48%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* SEVERITY PIE */}
        <ChartCard title="Severity Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} dataKey="count" outerRadius={90} label>
                  {severityData.map((s: any, i: number) => (
                    <Cell key={i} fill={s.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* INCIDENT CATEGORY COLORS */}
        <ChartCard title="Incident Categories">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="category" />
                <Tooltip />

                <Bar dataKey="count">
                  {categoryDistribution.map((entry: any, index: number) => (
                    <Cell
                      key={index}
                      fill={
                        categoryColors[entry.category] ||
                        categoryColors.Other
                      }
                    />
                  ))}
                </Bar>

              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* ADVANCED */}
        <section className="grid gap-6 lg:grid-cols-2">
          <AreaTimeSeriesChart data={timeSeries} />
          <StackedCategoryChart incidents={filteredIncidents} />
          <HeatmapChart incidents={filteredIncidents} />
        </section>

        {/* RESOURCES */}
        <section className="grid gap-6 lg:grid-cols-3">
          <GaugeChart value={overallUsage} label="Overall Utilization" />
          <ResourceUsageChart data={resourceGrouped} />
        </section>

      </div>
    </DashboardLayout>
  );
}
