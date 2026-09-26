import React, { useState } from 'react';
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
  LineChart,
  Line,
} from 'recharts';

import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import ChartCard from '../components/common/ChartCard';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';

import {
  THREAT_FEEDS,
  THREAT_CATEGORIES,
  DASHBOARD_STATS,
  RECENT_DNS_QUERIES,
} from '../data/mockData';

export default function ThreatIntelligencePage() {
  const [feeds, setFeeds] = useState(THREAT_FEEDS);
  const [syncingFeedId, setSyncingFeedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleSyncFeed = (id) => {
    setSyncingFeedId(id);
    setTimeout(() => {
      setFeeds((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, lastUpdate: 'Just now' } : f
        )
      );
      setSyncingFeedId(null);
      showToast(`Intelligence feed "${id}" synced with live threat database.`);
    }, 1000);
  };

  const handleSyncAllFeeds = () => {
    setSyncingFeedId('all');
    setTimeout(() => {
      setFeeds((prev) =>
        prev.map((f) => ({ ...f, lastUpdate: 'Just now' }))
      );
      setSyncingFeedId(null);
      showToast('All 6 intelligence feeds updated successfully.');
    }, 1400);
  };

  // Recent threats list (filtered from queries)
  const recentThreats = RECENT_DNS_QUERIES.filter(
    (q) => q.decision === 'BLOCK' || q.decision === 'FLAG'
  );

  const threatColumns = [
    {
      key: 'timestamp',
      header: 'Detected At',
      width: '150px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.timestamp}
        </span>
      ),
    },
    {
      key: 'domain',
      header: 'Threat IOC / Target Domain',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-rose-300 font-medium">
          {row.domain}
        </span>
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
            FEEDS SYNCHRONIZED
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            loading={syncingFeedId === 'all'}
            onClick={handleSyncAllFeeds}
          >
            Sync All Feeds
          </Button>
        }
      />

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Indicators</span>
            <div className="stat-card-icon bg-sky-500/10 text-sky-400">
              <Database size={18} />
            </div>
          </div>
          <div className="stat-card-value">{new Intl.NumberFormat().format(DASHBOARD_STATS.activeIndicatorsCount)}</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400 font-medium">+14,200 today</span>
            <span>across 6 feeds</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Blocklist Rules</span>
            <div className="stat-card-icon bg-rose-500/10 text-rose-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-card-value">{new Intl.NumberFormat().format(DASHBOARD_STATS.activeRulesCount)}</div>
          <div className="stat-card-meta">
            <span className="text-slate-300">Compiled in memory</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Threats Mitigated</span>
            <div className="stat-card-icon bg-purple-500/10 text-purple-400">
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-card-value">{DASHBOARD_STATS.threatsDetectedFormatted}</div>
          <div className="stat-card-meta">
            <span className="text-rose-400 font-medium">+342 in 24h</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Average Confidence</span>
            <div className="stat-card-icon bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-card-value">96.4%</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400">Low false-positive rate</span>
          </div>
        </div>
      </div>

      {/* Intelligence Feeds Grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Radio size={16} className="text-sky-400" />
          Ingested Threat Repositories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="p-5 rounded-xl bg-[#0f172a] border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      {feed.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">{feed.category}</span>
                  </div>
                  <StatusBadge type="system" value="ONLINE" label="ACTIVE" />
                </div>

                <div className="space-y-2 text-xs font-mono my-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Indicators:</span>
                    <span className="text-slate-200 font-semibold">
                      {new Intl.NumberFormat().format(feed.indicators)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Confidence:</span>
                    <span className="text-emerald-400">{feed.confidenceThreshold}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Last Synced:</span>
                    <span className="text-slate-300">{feed.lastUpdate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Reliability: {feed.reliabilityScore}%
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  loading={syncingFeedId === feed.id}
                  onClick={() => handleSyncFeed(feed.id)}
                  className="text-xs"
                >
                  Sync
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Threat Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Threat Categories Distribution"
          subtitle="Proportion of detected attacks by forensic type"
          icon={Activity}
          height={260}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={THREAT_CATEGORIES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                {THREAT_CATEGORIES.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Threat Severity Breakdown Card */}
        <Card
          title="Threat Classification Matrix"
          subtitle="Enforcement severity definitions & active counts"
          icon={ShieldCheck}
        >
          <div className="space-y-3">
            {THREAT_CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-medium text-slate-200">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                      cat.severity === 'Critical'
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                        : cat.severity === 'High'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-slate-400 bg-slate-800 border-slate-700'
                    }`}
                  >
                    {cat.severity}
                  </span>
                  <span className="font-mono text-slate-300 font-semibold w-14 text-right">
                    {new Intl.NumberFormat().format(cat.count)}
                  </span>
                  <span className="text-[11px] text-slate-500 w-10 text-right">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Threats Feed Table */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-rose-400" />
          Recent Hostile Interceptions
        </h2>
        <DataTable
          columns={threatColumns}
          data={recentThreats}
          pageSize={6}
          pageSizeOptions={[6, 12, 24]}
        />
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
