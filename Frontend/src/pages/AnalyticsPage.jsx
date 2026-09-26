import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Activity,
  Layers,
  ShieldAlert,
  Zap,
  Clock,
  TrendingUp,
  Cpu,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

import PageHeader from '../components/common/PageHeader';
import ChartCard from '../components/common/ChartCard';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';

import {
  QUERIES_TIMELINE_HOURLY,
  QUERIES_TIMELINE_DAILY,
  QUERY_TYPE_DISTRIBUTION,
  THREAT_CATEGORIES,
  TOP_QUERIED_DOMAINS,
  TOP_BLOCKED_DOMAINS,
  LATENCY_PERCENTILES,
  DASHBOARD_STATS,
} from '../data/mockData';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Forensic Analytics & Trend Insights"
        subtitle="Deep packet telemetry, resolution latency percentiles, and protocol distribution"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-mono rounded font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        }
      />

      {/* Top 4 KPI mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Avg Latency (p50)</span>
            <div className="stat-card-icon bg-emerald-500/10 text-emerald-400">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-card-value">3.2 ms</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400">Cache hit average</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Block Rate Trend</span>
            <div className="stat-card-icon bg-rose-500/10 text-rose-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-card-value">6.75%</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400 font-medium">-0.4% this week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Peak QPS</span>
            <div className="stat-card-icon bg-sky-500/10 text-sky-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-card-value">2,840 qps</div>
          <div className="stat-card-meta">
            <span className="text-slate-400">Recorded at 14:22 UTC</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Threat Detection Rate</span>
            <div className="stat-card-icon bg-purple-500/10 text-purple-400">
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-card-value">0.46%</div>
          <div className="stat-card-meta">
            <span className="text-slate-400">46 threats per 10k queries</span>
          </div>
        </div>
      </div>

      {/* Primary Chart: Queries per Hour vs Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Volume */}
        <ChartCard
          title="Queries Per Hour (24-Hour Timeline)"
          subtitle="Total volume breakdown by enforcement decision"
          icon={Activity}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={QUERIES_TIMELINE_HOURLY} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e2c47',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="total" name="Total Queries" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
              <Area type="monotone" dataKey="blocked" name="Blocked Queries" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Queries & Block Rate */}
        <ChartCard
          title="Queries Per Day (7-Day Trend)"
          subtitle="Daily aggregated query volume & block mitigation percentage"
          icon={Calendar}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={QUERIES_TIMELINE_DAILY} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e2c47',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="total" name="Total Queries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="blocked" name="Blocked" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Query Types & Threat Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Type Distribution */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Query RR Type Distribution"
            subtitle="Breakdown by DNS record type (A, AAAA, CNAME, etc.)"
            icon={Layers}
            height={280}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={QUERY_TYPE_DISTRIBUTION}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {QUERY_TYPE_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e2c47',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [new Intl.NumberFormat().format(val), 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
                {QUERY_TYPE_DISTRIBUTION.slice(0, 6).map((item) => (
                  <div key={item.name} className="flex flex-col text-xs font-mono">
                    <span className="text-slate-400 flex items-center justify-center gap-1 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-slate-200 font-semibold">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Threat Category Distribution */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Threat Category Frequency"
            subtitle="Relative volume of classified cyber incidents"
            icon={ShieldAlert}
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={THREAT_CATEGORIES}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={85} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e2c47',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {THREAT_CATEGORIES.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Latency Percentiles Card */}
        <div className="lg:col-span-1">
          <Card
            title="Response Time Percentiles"
            subtitle="Engine query resolution latency benchmarks"
            icon={Clock}
          >
            <div className="space-y-3">
              {LATENCY_PERCENTILES.map((lat) => (
                <div key={lat.percentile} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-semibold text-slate-200">{lat.percentile}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{lat.desc}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-sky-400">{lat.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Top Queried vs Top Blocked Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Ranked Top Queried Domains"
          subtitle="Top destination endpoints by volume"
          icon={TrendingUp}
        >
          <div className="space-y-2.5">
            {TOP_QUERIED_DOMAINS.map((item, idx) => (
              <div key={item.domain} className="flex items-center justify-between p-2 rounded bg-slate-900/40 hover:bg-slate-900 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-mono text-slate-500 font-semibold">#{idx + 1}</span>
                  <span className="font-mono text-slate-200">{item.domain}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">{item.category}</span>
                  <span className="font-mono font-semibold text-slate-200">{item.percent}</span>
                  <span className="font-mono text-slate-400 w-16 text-right">
                    {new Intl.NumberFormat().format(item.count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Ranked Intercepted Hostile Domains"
          subtitle="Hostile domains with highest block trigger rates"
          icon={ShieldAlert}
        >
          <div className="space-y-2.5">
            {TOP_BLOCKED_DOMAINS.map((item, idx) => (
              <div key={item.domain} className="flex items-center justify-between p-2 rounded bg-slate-900/40 hover:bg-slate-900 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 font-mono text-rose-500 font-semibold">#{idx + 1}</span>
                  <span className="font-mono text-rose-300 truncate max-w-[200px]" title={item.domain}>{item.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge type="threat" value={item.category} />
                  <span className="font-mono font-bold text-rose-400 w-16 text-right">
                    {new Intl.NumberFormat().format(item.count)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
