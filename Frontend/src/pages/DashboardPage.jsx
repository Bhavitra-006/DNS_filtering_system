import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Zap,
  Cpu,
  Layers,
  HardDrive,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Server,
  Database,
  SearchCheck,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import ChartCard from '../components/common/ChartCard';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';

import {
  DASHBOARD_STATS,
  QUERIES_TIMELINE_HOURLY,
  THREAT_CATEGORIES,
  TOP_QUERIED_DOMAINS,
  TOP_BLOCKED_DOMAINS,
  RECENT_DNS_QUERIES,
  SYSTEM_SERVICES,
} from '../data/mockData';

import { getStats, getQueries, getAnalytics, getStatus } from '../api/api';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [statsData, queriesData, analyticsData, statusData] = await Promise.allSettled([
          getStats(),
          getQueries(8),
          getAnalytics(),
          getStatus(),
        ]);

        if (!isMounted) return;

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }
        if (queriesData.status === 'fulfilled' && Array.isArray(queriesData.value?.queries)) {
          const mapped = queriesData.value.queries.map((q, idx) => ({
            id: `q-${idx}-${q.id}`,
            timestamp: q.queried_at || 'Just now',
            domain: q.domain || '-',
            queryType: q.query_type || 'A',
            decision: q.decision || 'ALLOW',
            threatType: q.threat_type || 'Clean',
            responseCode: q.response_code || 'NOERROR',
            responseTime: q.response_time_ms ? `${Number(q.response_time_ms).toFixed(1)} ms` : '1.2 ms',
          }));
          setRecentQueries(mapped);
        }
        if (analyticsData.status === 'fulfilled') {
          setAnalytics(analyticsData.value);
        }
        if (statusData.status === 'fulfilled') {
          setSystemStatus(statusData.value);
        }
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalQueries = stats ? Number(stats.total || 0) : DASHBOARD_STATS.totalQueries;
  const allowedQueries = stats ? Number(stats.allowed || 0) : DASHBOARD_STATS.allowedQueries;
  const blockedQueries = stats ? Number(stats.blocked || 0) : DASHBOARD_STATS.blockedQueries;
  const flaggedQueries = stats ? Number(stats.flagged || 0) : Number(DASHBOARD_STATS.flaggedQueries || 0);
  const threatsDetected = stats ? Number(stats.threats_detected || 0) : DASHBOARD_STATS.threatsDetected;

  const allowedPercent =
    totalQueries > 0 ? ((allowedQueries / totalQueries) * 100).toFixed(1) + '%' : '0%';
  const blockedPercent =
    totalQueries > 0 ? ((blockedQueries / totalQueries) * 100).toFixed(1) + '%' : '0%';
  const blockRate = stats?.block_rate || blockedPercent;
  const cacheHitRate = stats?.cache_hit_rate || DASHBOARD_STATS.cacheHitRate;

  const decisionData = [
    { name: 'Allowed', value: allowedQueries, color: '#10b981' },
    { name: 'Blocked', value: blockedQueries, color: '#f43f5e' },
    { name: 'Flagged', value: flaggedQueries, color: '#f59e0b' },
  ];

  // Timeline chart data (use real backend data if available, fallback to mock)
  const timelineData =
    analytics?.hourly_timeline && analytics.hourly_timeline.length > 0
      ? analytics.hourly_timeline.map((h) => ({
          time: h.time,
          allowed: Number(h.allowed || 0),
          blocked: Number(h.blocked || 0),
          flagged: Number(h.flagged || 0),
          total: Number(h.total || 0),
        }))
      : QUERIES_TIMELINE_HOURLY;

  // Threat categories data
  const threatCategoriesData =
    analytics?.threat_categories && analytics.threat_categories.length > 0
      ? analytics.threat_categories.map((tc, idx) => ({
          name: tc.threat_type,
          count: Number(tc.count || 0),
          color: ['#f43f5e', '#ec4899', '#f59e0b', '#8b5cf6', '#3b82f6'][idx % 5],
        }))
      : THREAT_CATEGORIES;

  // Top queried domains
  const topQueriedList =
    analytics?.top_queried && analytics.top_queried.length > 0
      ? analytics.top_queried.map((t) => ({
          domain: t.domain,
          category: 'Standard',
          count: Number(t.count || 0),
        }))
      : TOP_QUERIED_DOMAINS;

  // Top blocked domains
  const topBlockedList =
    analytics?.top_blocked && analytics.top_blocked.length > 0
      ? analytics.top_blocked.map((t) => ({
          domain: t.domain,
          category: t.threat_type || 'Malicious',
          count: Number(t.count || 0),
        }))
      : TOP_BLOCKED_DOMAINS;

  const recentColumns = [
    {
      key: 'timestamp',
      header: 'Time',
      width: '140px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.timestamp.includes(' ') ? row.timestamp.split(' ')[1] : row.timestamp}
        </span>
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 max-w-[280px]">
          <span
            className="font-mono text-xs text-slate-200 truncate hover:text-sky-400 transition-colors"
            title={row.domain}
          >
            {row.domain}
          </span>
        </div>
      ),
    },
    {
      key: 'queryType',
      header: 'Type',
      width: '80px',
      sortable: true,
      render: (row) => <StatusBadge type="queryType" value={row.queryType} />,
    },
    {
      key: 'decision',
      header: 'Decision',
      width: '100px',
      sortable: true,
      render: (row) => <StatusBadge type="decision" value={row.decision} />,
    },
    {
      key: 'threatType',
      header: 'Threat Type',
      width: '130px',
      sortable: true,
      render: (row) => <StatusBadge type="threat" value={row.threatType} />,
    },
    {
      key: 'responseTime',
      header: 'Latency',
      width: '90px',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.responseTime}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="DNS Threat Defense Overview"
        subtitle="Real-time SOC telemetry, deep packet inspection, and threat stream analytics"
        icon={Activity}
        badge={
          <StatusBadge
            type="system"
            value="ONLINE"
            label={systemStatus?.status === 'READY' ? 'DAEMON READY (5354)' : 'STREAM ACTIVE'}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={SearchCheck}
              onClick={() => onNavigate('checker')}
            >
              Analyze Domain
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ExternalLink}
              onClick={() => onNavigate('queries')}
            >
              Live Query Log
            </Button>
          </div>
        }
      />

      {/* 8 Primary SOC Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total DNS Queries"
          value={totalQueries.toLocaleString()}
          change={DASHBOARD_STATS.totalQueriesChange}
          changeType="positive"
          icon={Activity}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10"
          footer="Persistent MySQL log"
        />

        <StatCard
          title="Allowed Queries"
          value={allowedQueries.toLocaleString()}
          subValue={`${allowedPercent} of total`}
          change="Clean traffic"
          changeType="good"
          icon={ShieldCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />

        <StatCard
          title="Blocked Queries"
          value={blockedQueries.toLocaleString()}
          subValue={`${blockedPercent} blocked`}
          change={stats ? `${blockedQueries} intercepted` : DASHBOARD_STATS.blockedQueriesChange}
          changeType="bad"
          icon={ShieldX}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
        />

        <StatCard
          title="Flagged Queries"
          value={flaggedQueries.toLocaleString()}
          subValue={totalQueries > 0 ? `${((flaggedQueries / totalQueries) * 100).toFixed(1)}% under review` : '0%'}
          change="Behavioral alerts"
          changeType="neutral"
          icon={ShieldAlert}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />

        <StatCard
          title="Block Rate"
          value={blockRate}
          change="Mitigation ratio"
          changeType="good"
          icon={TrendingUp}
          iconColor="text-rose-400"
          iconBg="bg-rose-500/10"
          footer="Enforced security ratio"
        />

        <StatCard
          title="Threats Detected"
          value={threatsDetected.toLocaleString()}
          change={stats ? `${stats.active_rules || 14} active rules` : DASHBOARD_STATS.threatsDetectedChange}
          changeType="bad"
          icon={Zap}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          footer="IOC feeds & DGA ML"
        />

        <StatCard
          title="Cache Hit Rate"
          value={cacheHitRate}
          change={stats ? `${stats.cache_hits || 0} hits / ${stats.cache_misses || 0} miss` : 'In-memory TTL'}
          changeType="good"
          icon={Layers}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          footer="Memory cache engine"
        />

        <StatCard
          title="System Status"
          value={systemStatus?.database_status === 'ONLINE' ? 'OPERATIONAL' : 'ONLINE'}
          statusBadge={<StatusBadge type="system" value="ONLINE" />}
          change="DNS + API Services"
          changeType="good"
          icon={Server}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Query Volume Stream */}
        <div className="lg:col-span-2">
          <ChartCard
            title="DNS Queries Stream Over Time"
            subtitle="Comparing allowed, blocked, and flagged traffic"
            icon={Activity}
            height={300}
            actions={
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" /> Allowed
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Blocked
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Flagged
                </span>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e2c47',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  name="Allowed"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAllowed)"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBlocked)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Right: Decision Ratio Breakdown */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Traffic Decision Distribution"
            subtitle="Live enforcement proportions"
            icon={ShieldCheck}
            height={300}
          >
            <div className="flex flex-col h-full justify-between">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {decisionData.map((entry, index) => (
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
                      formatter={(val) => [new Intl.NumberFormat().format(val), 'Queries']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with percentages */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
                {decisionData.map((item) => (
                  <div key={item.name} className="flex flex-col">
                    <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                      {item.name === 'Allowed'
                        ? allowedPercent
                        : item.name === 'Blocked'
                        ? blockedPercent
                        : totalQueries > 0
                        ? `${((flaggedQueries / totalQueries) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Secondary Charts Row: Threat Categories & Top Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Detection Categories */}
        <div className="lg:col-span-1">
          <ChartCard
            title="Threat Categories"
            subtitle="Incidents classified across active feeds & ML"
            icon={ShieldAlert}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={threatCategoriesData.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e2c47',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} detections`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {threatCategoriesData.slice(0, 5).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top Queried Domains */}
        <div className="lg:col-span-1">
          <Card
            title="Top Queried Domains"
            subtitle="Highest volume resolved endpoints"
            icon={TrendingUp}
            action={
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                Analytics <ArrowUpRight size={12} />
              </button>
            }
          >
            <div className="space-y-3">
              {topQueriedList.slice(0, 5).map((item, idx) => (
                <div key={item.domain} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-slate-500 font-mono font-medium text-[11px]">#{idx + 1}</span>
                    <span className="font-mono text-slate-200 truncate max-w-[150px]" title={item.domain}>
                      {item.domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {item.category || 'DNS'}
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      {new Intl.NumberFormat().format(item.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top Blocked Domains */}
        <div className="lg:col-span-1">
          <Card
            title="Top Blocked Domains"
            subtitle="Most frequent hostile IOCs intercepted"
            icon={ShieldX}
            action={
              <button
                type="button"
                onClick={() => onNavigate('blocked')}
                className="text-xs text-rose-400 hover:underline inline-flex items-center gap-1"
              >
                View Blocklist <ArrowUpRight size={12} />
              </button>
            }
          >
            <div className="space-y-3">
              {topBlockedList.slice(0, 5).map((item, idx) => (
                <div key={item.domain} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-rose-400/80 font-mono font-medium text-[11px]">#{idx + 1}</span>
                    <span className="font-mono text-slate-200 truncate max-w-[140px]" title={item.domain}>
                      {item.domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="threat" value={item.category} />
                    <span className="font-mono font-semibold text-rose-400">
                      {new Intl.NumberFormat().format(item.count)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent DNS Activity Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Clock size={16} className="text-sky-400" />
              Recent DNS Activity
            </h2>
            <p className="text-xs text-slate-400">
              Live queries logged to MySQL and inspected by the DNS filtering system
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => onNavigate('queries')}>
            Explore All Queries
          </Button>
        </div>

        <DataTable
          columns={recentColumns}
          data={recentQueries.length > 0 ? recentQueries : RECENT_DNS_QUERIES.slice(0, 8)}
          showPagination={false}
        />
      </div>

      {/* System Health Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Server size={16} className="text-emerald-400" />
              Core Infrastructure Health
            </h2>
            <p className="text-xs text-slate-400">
              Real-time operational status of DNS filter server, API, Database, and ML pipelines
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('system-status')}
            className="text-xs text-sky-400 hover:underline font-medium inline-flex items-center gap-1"
          >
            Detailed Metrics <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">DNS Filtering Server</h3>
                <span className="text-[11px] text-slate-400 font-mono">127.0.0.1:5354 (UDP)</span>
              </div>
              <StatusBadge type="system" value="ONLINE" label="READY" />
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Upstream resolver pointing to 8.8.8.8:53 with sub-millisecond sinkholing.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/70 text-[11px] font-mono">
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                <div className="text-slate-500 text-[10px]">Active Port</div>
                <div className="text-slate-200 font-semibold">{systemStatus?.dns_port || 5354}</div>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                <div className="text-slate-500 text-[10px]">Upstream</div>
                <div className="text-slate-200 font-semibold">{systemStatus?.upstream_dns || '8.8.8.8'}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">MySQL Database</h3>
                <span className="text-[11px] text-slate-400 font-mono">dns_filtering @ 3306</span>
              </div>
              <StatusBadge type="system" value="ONLINE" label="CONNECTED" />
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Persistent connection pool with asynchronous queue worker.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/70 text-[11px] font-mono">
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                <div className="text-slate-500 text-[10px]">Logged Queries</div>
                <div className="text-slate-200 font-semibold">{totalQueries.toLocaleString()}</div>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                <div className="text-slate-500 text-[10px]">Blocked Rules</div>
                <div className="text-slate-200 font-semibold">{stats?.active_rules || 14}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">AI / ML DGA Detector</h3>
                <span className="text-[11px] text-slate-400 font-mono">Random Forest Classifier</span>
              </div>
              <StatusBadge type="system" value="ONLINE" label="LOADED" />
            </div>
            <p className="text-xs text-slate-400 mb-3">
              18-feature lexical entropy and n-gram inference for algorithmically generated domains.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/70 text-[11px] font-mono">
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                <div className="text-slate-500 text-[10px]">Threshold</div>
                <div className="text-slate-200 font-semibold">80.0%</div>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/50">
                <div className="text-slate-500 text-[10px]">Model</div>
                <div className="text-slate-200 font-semibold">dga_model.pkl</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
