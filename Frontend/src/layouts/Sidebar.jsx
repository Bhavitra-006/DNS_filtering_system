import React from 'react';
import {
  LayoutDashboard,
  Activity,
  ShieldBan,
  SearchCheck,
  Radar,
  BarChart3,
  ServerCog,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Radio,
  Zap,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'queries', label: 'DNS Queries', icon: Activity, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
  { id: 'blocked', label: 'Blocked Domains', icon: ShieldBan, count: '142K' },
  { id: 'checker', label: 'Domain Checker', icon: SearchCheck },
  { id: 'threat-intel', label: 'Threat Intelligence', icon: Radar, badge: '6 Feeds', badgeColor: 'bg-sky-500/20 text-sky-400' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'system-status', label: 'System Status', icon: ServerCog, pulse: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
}) {
  return (
    <aside
      className={`relative flex flex-col h-screen sticky top-0 bg-[#0b111e] border-r border-slate-800/90 transition-all duration-300 ease-in-out z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setActivePage('dashboard')}>
          <div className="relative flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-600/30 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Shield size={20} className="text-sky-400" />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wider text-slate-100 uppercase font-mono flex items-center gap-1.5">
                DNS Sentinel
              </span>
              <span className="text-[10px] tracking-widest text-sky-400/80 uppercase font-mono font-medium">
                SOC THREAT DEFENSE
              </span>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800/60 transition-colors hidden md:flex items-center justify-center"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-2.5 overflow-y-auto space-y-1">
        <div className={`px-2 pb-2 text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Security Modules'}
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative ${
                isActive
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.12)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-400 rounded-r shadow-[0_0_8px_#38bdf8]" />
              )}

              <Icon
                size={18}
                className={`flex-shrink-0 transition-transform ${
                  isActive ? 'text-sky-400 scale-105' : 'text-slate-400'
                }`}
              />

              {!collapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.count}
                    </span>
                  )}
                  {item.pulse && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Engine Status Footer */}
      {!collapsed && (
        <div className="p-3 m-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 text-xs text-slate-400">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              ENGINE ACTIVE
            </span>
            <span className="text-[10px] text-slate-500 font-mono">UDP/53</span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Throughput:</span>
              <span className="text-slate-200">1,420 qps</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Block Ratio:</span>
              <span className="text-rose-400 font-medium">6.75%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cache Ratio:</span>
              <span className="text-emerald-400 font-medium">84.6%</span>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="p-3 text-center border-t border-slate-800/90">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#10b981]" title="System Online" />
        </div>
      )}
    </aside>
  );
}
