import React, { useState } from 'react';
import {
  ServerCog,
  CheckCircle2,
  RefreshCw,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Zap,
  Terminal,
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

import { SYSTEM_SERVICES } from '../data/mockData';

export default function SystemStatusPage() {
  const [services, setServices] = useState(SYSTEM_SERVICES);
  const [refreshingId, setRefreshingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleRestartService = (id, name) => {
    setRefreshingId(id);
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, lastChecked: 'Just now' } : s
        )
      );
      setRefreshingId(null);
      showToast(`Health check & ping dispatched to "${name}". Status: ONLINE.`);
    }, 800);
  };

  const handleRefreshAll = () => {
    setRefreshingId('all');
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) => ({ ...s, lastChecked: 'Just now' }))
      );
      setRefreshingId(null);
      showToast('All 8 system microservices verified and operational.');
    }, 1200);
  };

  const allOnline = services.every((s) => s.status === 'ONLINE');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="SOC Infrastructure & Node Health"
        subtitle="Operational telemetry for resolver daemons, caches, databases, and inference pipelines"
        icon={ServerCog}
        badge={
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            8/8 NODES OPERATIONAL
          </span>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshingId === 'all'}
            onClick={handleRefreshAll}
          >
            Poll Node Status
          </Button>
        }
      />

      {/* Cluster Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">CPU Cluster Load</span>
            <div className="stat-card-icon bg-sky-500/10 text-sky-400">
              <Cpu size={18} />
            </div>
          </div>
          <div className="stat-card-value">18.4%</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400">Normal load (32 cores)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">RAM Allocated</span>
            <div className="stat-card-icon bg-purple-500/10 text-purple-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-card-value">4.2 / 16 GB</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400">26% Utilization</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Network Throughput</span>
            <div className="stat-card-icon bg-emerald-500/10 text-emerald-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="stat-card-value">124 Mb/s</div>
          <div className="stat-card-meta">
            <span className="text-slate-400">Egress: 42 Mb/s</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">DNS Cache Hit Ratio</span>
            <div className="stat-card-icon bg-sky-500/10 text-sky-400">
              <Zap size={18} />
            </div>
          </div>
          <div className="stat-card-value">84.6%</div>
          <div className="stat-card-meta">
            <span className="text-emerald-400 font-medium">+2.1% efficiency</span>
          </div>
        </div>
      </div>

      {/* 8 Specific Service Health Cards Grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          Service Daemons & Health Matrix
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-xl bg-[#0f172a] border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      {service.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {service.subName}
                    </div>
                  </div>
                  <StatusBadge type="system" value={service.status} />
                </div>

                <p className="text-xs text-slate-400 my-3 leading-relaxed">
                  {service.description}
                </p>

                {/* Metrics */}
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs font-mono my-2">
                  {service.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="flex justify-between">
                      <span className="text-slate-400 text-[11px]">{m.label}:</span>
                      <span className="text-slate-200 font-semibold">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Checked: {service.lastChecked}</span>
                <button
                  type="button"
                  onClick={() => handleRestartService(service.id, service.name)}
                  className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
                  title="Ping service"
                >
                  <RefreshCw
                    size={11}
                    className={refreshingId === service.id ? 'animate-spin' : ''}
                  />
                  <span>Test Ping</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident / Audit Log History */}
      <Card
        title="Cluster Incident & Event Log (Past 24 Hours)"
        subtitle="Automated failover, health checkpoints, and daemon telemetry"
        icon={Terminal}
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-slate-400 text-[11px] mb-0.5">
                <span className="text-emerald-400 font-semibold">HEALTH CHECK SUCCESS</span>
                <span>2026-09-24 16:30:00 UTC</span>
              </div>
              <p className="text-slate-200">
                All 8 microservices responded with HTTP 200 / UDP Echo within SLA threshold (&lt;5ms).
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-slate-400 text-[11px] mb-0.5">
                <span className="text-sky-400 font-semibold">CACHE FLUSH / GC</span>
                <span>2026-09-24 15:00:14 UTC</span>
              </div>
              <p className="text-slate-200">
                Redis memory defragmentation completed. 14,200 expired DNS TTL records pruned. Memory freed: 142 MB.
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-slate-400 text-[11px] mb-0.5">
                <span className="text-amber-400 font-semibold">BURST ALERT SINKHOLED</span>
                <span>2026-09-24 12:45:22 UTC</span>
              </div>
              <p className="text-slate-200">
                Behavioral engine flagged TXT query burst from lab endpoint. Rate-limiting policy temporarily enforced.
              </p>
            </div>
          </div>
        </div>
      </Card>

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
