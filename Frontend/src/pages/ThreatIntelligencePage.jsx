import React, { useState, useEffect, useCallback } from 'react';
import {
  Radar,
  RefreshCw,
  Database,
  ShieldCheck,
  AlertTriangle,
  Radio,
  ExternalLink,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';

import { getThreatIntel, syncThreatIntel, getQueries } from '../api/api';

// Threat category colours
const THREAT_COLORS = {
  Phishing: '#f43f5e',
  'Malware C2': '#a855f7',
  DGA: '#f97316',
  'DNS Tunneling': '#eab308',
  Botnet: '#3b82f6',
  'Crypto Miner': '#06b6d4',
  'Malicious Domain': '#64748b',
  Suspicious: '#94a3b8',
};

function buildCategoryChart(indicators) {
  const counts = {};
  indicators.forEach((ind) => {
    const key = ind.threat_type || 'Malicious Domain';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    color: THREAT_COLORS[name] || '#64748b',
  }));
}

export default function ThreatIntelligencePage() {
  const [indicators, setIndicators] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, avgConfidence: 0 });
  const [recentThreats, setRecentThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setApiError('');

      const [intelData, queriesData] = await Promise.allSettled([
        getThreatIntel(),
        getQueries(100),
      ]);

      // Threat intel
      if (intelData.status === 'fulfilled') {
        const raw = intelData.value;
        const inds = Array.isArray(raw?.indicators) ? raw.indicators : [];
        setIndicators(inds);

        const active = inds.filter((i) => i.active !== false);
        const avgConf =
          active.length > 0
            ? Math.round(
                (active.reduce((sum, i) => sum + (parseFloat(i.confidence) || 0), 0) /
                  active.length) *
                  100
              ) / 100
            : 0;

        setStats({
          total: inds.length,
          active: active.length,
          avgConfidence: avgConf,
        });
      }

      // Recent threat detections from query log
      if (queriesData.status === 'fulfilled') {
        const qs = Array.isArray(queriesData.value?.queries) ? queriesData.value.queries : [];
        const threats = qs
          .filter((q) => q.decision === 'BLOCK' || q.decision === 'FLAG')
          .slice(0, 50)
          .map((q, idx) => ({
            id: `threat-${idx}`,
            timestamp: q.queried_at ? q.queried_at.replace('T', ' ').substring(0, 19) : '-',
            domain: q.domain || '-',
            threatType: q.threat_type || 'Unknown',
            decision: q.decision || 'BLOCK',
            sourceIp: '-',
            sourceHost: '-',
          }));
        setRecentThreats(threats);
      }
    } catch (err) {
      console.error('Failed to load threat intel:', err);
      setApiError('Unable to load threat intelligence data from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const result = await syncThreatIntel();
      showToast(result?.message || 'Threat intelligence feeds synchronized.');
      await loadData();
    } catch (err) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const categoryChart = buildCategoryChart(indicators);

  const threatColumns = [
    {
      key: 'timestamp',
      header: 'Detected At',
      width: '150px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">{row.timestamp}</span>
      ),
    },
    {
      key: 'domain',
      header: 'Threat IOC / Target Domain',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-rose-300 font-medium">{row.domain}</span>
      ),
    },
    {
      key: 'threatType',
      header: 'Category',
      width: '140px',
      sortable: true,
      render: (row) => <StatusBadge type="threat" value={row.threatType} />,
    },
    {
      key: 'decision',
      header: 'Mitigation',
      width: '100px',
      sortable: true,
      render: (row) => <StatusBadge type="decision" value={row.decision} />,
    },
    {
      key: 'sourceIp',
      header: 'Compromised Origin',
      width: '170px',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-slate-200">{row.sourceIp}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.sourceHost}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Threat Intelligence Feeds & IOC Aggregator"
        subtitle="Continuous telemetry ingestion from global open-source and commercial threat repositories"
        icon={Radar}
        badge={
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
            {loading ? 'LOADING...' : `${stats.active} ACTIVE IOCs`}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              loading={loading}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              loading={syncing}
              onClick={handleSyncAll}
            >
              Sync All Feeds
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

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Indicators</span>
            <div className="stat-card-icon bg-sky-500/10 text-sky-400">
              <Database size={18} />
            </div>
          </div>
          <div className="stat-card-value">{new Intl.NumberFormat().format(stats.total)}</div>
          <div className="stat-card-meta">
            <span className="text-slate-400">in threat_intel table</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active IOCs</span>
            <div className="stat-card-icon bg-rose-500/10 text-rose-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-card-value">{new Intl.NumberFormat().format(stats.active)}</div>
          <div className="stat-card-meta">
            <span className="text-slate-300">Currently enforced</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Threats Detected</span>
            <div className="stat-card-icon bg-purple-500/10 text-purple-400">
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-card-value">{recentThreats.length}</div>
          <div className="stat-card-meta">
            <span className="text-rose-400 font-medium">from last 100 queries</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Average Confidence</span>
            <div className="stat-card-icon bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value">
            {stats.avgConfidence > 0 ? `${(stats.avgConfidence * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="stat-card-meta">
            <span className="text-emerald-400">across active indicators</span>
          </div>
        </div>
      </div>

      {/* Threat Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Threat Categories Distribution"
          subtitle="Proportion of IOC indicators by forensic type"
          icon={Activity}
          height={260}
        >
          {categoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e2c47',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryChart.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {loading ? 'Loading chart data...' : 'No indicator data available'}
            </div>
          )}
        </ChartCard>

        {/* Threat Classification Matrix */}
        <Card
          title="Threat Classification Matrix"
          subtitle="IOC breakdown by threat type and count"
          icon={ShieldCheck}
        >
          <div className="space-y-3">
            {categoryChart.length > 0 ? (
              categoryChart.map((cat) => {
                const total = categoryChart.reduce((s, c) => s + c.count, 0);
                const pct = total > 0 ? ((cat.count / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-300 font-semibold w-14 text-right">
                        {new Intl.NumberFormat().format(cat.count)}
                      </span>
                      <span className="text-[11px] text-slate-500 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-500 text-xs text-center py-4">
                {loading ? 'Loading...' : 'No indicators loaded yet.'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Threats Feed Table */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-rose-400" />
          Recent Hostile Interceptions
        </h2>
        {loading ? (
          <div className="p-8 rounded-xl bg-[#0f172a] border border-slate-800/90 text-center text-slate-500 text-sm">
            Loading threat detections...
          </div>
        ) : (
          <DataTable
            columns={threatColumns}
            data={recentThreats}
            pageSize={6}
            pageSizeOptions={[6, 12, 24]}
            emptyTitle="No Hostile Interceptions Logged"
            emptyDescription="No BLOCK or FLAG decisions found in the recent query log."
          />
        )}
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="soc-toast">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
