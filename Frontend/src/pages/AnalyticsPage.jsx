import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  Activity,
  Layers,
  ShieldAlert,
  Zap,
  Clock,
  TrendingUp,
  Download,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import PageHeader from '../components/common/PageHeader';
import ChartCard from '../components/common/ChartCard';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';

import { getAnalytics, getQueries } from '../api/api';
import { exportDataAsFile } from '../utils/formatters';

const QUERY_TYPE_COLORS = {
  A: '#38bdf8',
  AAAA: '#818cf8',
  CNAME: '#34d399',
  TXT: '#fbbf24',
  MX: '#f97316',
  PTR: '#94a3b8',
  OTHER: '#64748b',
};

const THREAT_COLORS = {
  Phishing: '#f43f5e',
  'Malware C2': '#a855f7',
  DGA: '#f97316',
  'DNS Tunneling': '#eab308',
  Botnet: '#3b82f6',
  'Crypto Miner': '#06b6d4',
  'Malicious Domain': '#64748b',
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('24h');
  const [analytics, setAnalytics] = useState(null);
  const [queryTypeData, setQueryTypeData] = useState([]);
  const [threatData, setThreatData] = useState([]);
  const [topQueried, setTopQueried] = useState([]);
  const [topBlocked, setTopBlocked] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, blocked: 0, allowed: 0, flagged: 0, blockRate: '0.00' });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setApiError('');

      const [analyticsRes, queriesRes] = await Promise.allSettled([
        getAnalytics(),
        getQueries(200),
      ]);

      // Process analytics (hourly timeline etc.)
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value);
      }

      // Derive everything else from the queries log
      if (queriesRes.status === 'fulfilled') {
        const qs = Array.isArray(queriesRes.value?.queries) ? queriesRes.value.queries : [];

        // KPIs
        const total = qs.length;
        const blocked = qs.filter((q) => q.decision === 'BLOCK').length;
        const allowed = qs.filter((q) => q.decision === 'ALLOW').length;
        const flagged = qs.filter((q) => q.decision === 'FLAG').length;
        const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(2) : '0.00';
        setKpis({ total, blocked, allowed, flagged, blockRate });

        // Query type distribution
        const typeCounts = {};
        qs.forEach((q) => {
          const t = q.query_type || 'OTHER';
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const typeArr = Object.entries(typeCounts).map(([name, count]) => ({
          name,
          count,
          color: QUERY_TYPE_COLORS[name] || '#94a3b8',
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
        }));
        setQueryTypeData(typeArr);

        // Threat category distribution
        const threatCounts = {};
        qs.filter((q) => q.decision === 'BLOCK' || q.decision === 'FLAG').forEach((q) => {
          const t = q.threat_type || 'Malicious Domain';
          threatCounts[t] = (threatCounts[t] || 0) + 1;
        });
        const threatArr = Object.entries(threatCounts).map(([name, count]) => ({
          name,
          count,
          color: THREAT_COLORS[name] || '#64748b',
        }));
        setThreatData(threatArr);

        // Top queried domains
        const domainCounts = {};
        qs.forEach((q) => {
          const d = q.domain;
          if (d) domainCounts[d] = (domainCounts[d] || 0) + 1;
        });
        const sortedDomains = Object.entries(domainCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([domain, count]) => ({
            domain,
            count,
            percent: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%',
            category: qs.find((q) => q.domain === domain)?.decision === 'BLOCK' ? 'Blocked' : 'Allowed',
          }));
        setTopQueried(sortedDomains);

        // Top blocked domains
        const blockedCounts = {};
        qs.filter((q) => q.decision === 'BLOCK').forEach((q) => {
          const d = q.domain;
          if (d) blockedCounts[d] = (blockedCounts[d] || 0) + 1;
        });
        const sortedBlocked = Object.entries(blockedCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([domain, count]) => ({
            domain,
            count,
            category: qs.find((q) => q.domain === domain)?.threat_type || 'Malicious Domain',
          }));
        setTopBlocked(sortedBlocked);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      setApiError('Unable to load analytics data from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Build hourly chart from analytics or queries
  const hourlyData = (() => {
    if (analytics?.hourly_timeline && analytics.hourly_timeline.length > 0) {
      return analytics.hourly_timeline.map((h) => ({
        time: h.hour || h.time || '-',
        total: h.total || 0,
        blocked: h.blocked || 0,
      }));
    }
    return [];
  })();

  // Build daily chart from analytics
  const dailyData = (() => {
    if (analytics?.daily_timeline && analytics.daily_timeline.length > 0) {
      return analytics.daily_timeline.map((d) => ({
        date: d.date || '-',
        total: d.total || 0,
        blocked: d.blocked || 0,
      }));
    }
    return [];
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Forensic Analytics & Trend Insights"
        subtitle="Deep packet telemetry, resolution latency percentiles, and protocol distribution"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-2">
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
            <Button variant="secondary" size="sm" icon={RotateCcw} loading={loading} onClick={loadData}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {apiError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Top 4 KPI mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Queries</span>
            <div className="stat-card-icon bg-sky-500/10 text-sky-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-card-value">{new Intl.NumberFormat().format(kpis.total)}</div>
          <div className="stat-card-meta">
            <span className="text-slate-400">from last 200 records</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Block Rate</span>
            <div className="stat-card-icon bg-rose-500/10 text-rose-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-card-value">{kpis.blockRate}%</div>
          <div className="stat-card-meta">
            <span className="text-rose-400 font-medium">{kpis.blocked} blocked</span>
            <span className="text-slate-400"> / {kpis.total} total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Allowed Queries</span>
            <div className="stat-card-icon bg-emerald-500/10 text-emerald-400">
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-card-value">{new Intl.NumberFormat().format(kpis.allowed)}</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400">{kpis.flagged} flagged</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Threat Types</span>
            <div className="stat-card-icon bg-purple-500/10 text-purple-400">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="stat-card-value">{threatData.length}</div>
          <div className="stat-card-meta">
            <span className="text-slate-400">distinct categories</span>
          </div>
        </div>
      </div>

      {/* Primary Chart: Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Volume */}
        <ChartCard
          title="Queries Per Hour (24-Hour Timeline)"
          subtitle="Total volume breakdown by enforcement decision"
          icon={Activity}
          height={280}
        >
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e2c47',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="total" name="Total Queries" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {loading ? 'Loading timeline...' : 'No hourly data available yet'}
            </div>
          )}
        </ChartCard>

        {/* Daily Queries */}
        <ChartCard
          title="Queries Per Day (7-Day Trend)"
          subtitle="Daily aggregated query volume & block mitigation"
          icon={Calendar}
          height={280}
        >
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
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
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {loading ? 'Loading daily data...' : 'No daily trend data available yet'}
            </div>
          )}
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
                {queryTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={queryTypeData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        paddingAngle={3}
                      >
                        {queryTypeData.map((entry, index) => (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    {loading ? 'Loading...' : 'No data'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
                {queryTypeData.slice(0, 6).map((item) => (
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
            {threatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={threatData}
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
                    {threatData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                {loading ? 'Loading...' : 'No threat data yet'}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Response Latency Summary Card */}
        <div className="lg:col-span-1">
          <Card
            title="Query Decision Summary"
            subtitle="Breakdown by enforcement action"
            icon={Clock}
          >
            <div className="space-y-3">
              {[
                { label: 'ALLOW', value: kpis.allowed, color: '#10b981', bg: 'bg-emerald-500/10' },
                { label: 'BLOCK', value: kpis.blocked, color: '#f43f5e', bg: 'bg-rose-500/10' },
                { label: 'FLAG', value: kpis.flagged, color: '#f97316', bg: 'bg-amber-500/10' },
              ].map((item) => (
                <div key={item.label} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-semibold text-slate-200">{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {kpis.total > 0 ? ((item.value / kpis.total) * 100).toFixed(1) : '0.0'}% of traffic
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold" style={{ color: item.color }}>
                      {new Intl.NumberFormat().format(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Top Queried vs Top Blocked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Ranked Top Queried Domains"
          subtitle="Top destination endpoints by volume"
          icon={TrendingUp}
        >
          <div className="space-y-2.5">
            {topQueried.length > 0 ? (
              topQueried.map((item, idx) => (
                <div key={item.domain} className="flex items-center justify-between p-2 rounded bg-slate-900/40 hover:bg-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-mono text-slate-500 font-semibold">#{idx + 1}</span>
                    <span className="font-mono text-slate-200 truncate max-w-[200px]" title={item.domain}>{item.domain}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{item.category}</span>
                    <span className="font-mono font-semibold text-slate-200">{item.percent}</span>
                    <span className="font-mono text-slate-400 w-12 text-right">
                      {new Intl.NumberFormat().format(item.count)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs text-center py-4">
                {loading ? 'Loading...' : 'No query data available'}
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Ranked Intercepted Hostile Domains"
          subtitle="Hostile domains with highest block trigger rates"
          icon={ShieldAlert}
        >
          <div className="space-y-2.5">
            {topBlocked.length > 0 ? (
              topBlocked.map((item, idx) => (
                <div key={item.domain} className="flex items-center justify-between p-2 rounded bg-slate-900/40 hover:bg-slate-900 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 font-mono text-rose-500 font-semibold">#{idx + 1}</span>
                    <span className="font-mono text-rose-300 truncate max-w-[200px]" title={item.domain}>{item.domain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="threat" value={item.category} />
                    <span className="font-mono font-bold text-rose-400 w-12 text-right">
                      {new Intl.NumberFormat().format(item.count)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs text-center py-4">
                {loading ? 'Loading...' : 'No blocked domains in query log'}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
