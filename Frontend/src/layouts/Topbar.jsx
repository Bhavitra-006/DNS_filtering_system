import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Menu,
  ShieldCheck,
  RefreshCw,
  User,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { RECENT_SECURITY_NOTIFICATIONS } from '../data/mockData';

export default function Topbar({
  activePage,
  onNavigate,
  onToggleMobileSidebar,
  onRefresh,
}) {
  const [notifications, setNotifications] = useState(RECENT_SECURITY_NOTIFICATIONS);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="h-16 bg-[#0d1424] border-b border-slate-800/90 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left section: mobile toggle & cluster badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden"
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
          <span className="text-slate-300 font-semibold tracking-wider">CLUSTER-ALPHA-01</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">PROD SOC</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck size={14} />
          <span>ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Right section: UTC clock, Refresh, Notifications, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Real-time UTC clock */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800/70">
          <Clock size={13} className="text-sky-400" />
          <span>{currentTime || 'Syncing...'}</span>
        </div>

        {/* Manual Refresh Action */}
        <button
          type="button"
          onClick={handleRefreshClick}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          title="Refresh stream data"
        >
          <RefreshCw
            size={15}
            className={`transition-transform duration-500 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`}
          />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Security Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_#f43f5e]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111a2e] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Security Alerts ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 hover:bg-slate-800/50 transition-colors flex items-start gap-3 ${
                      !item.read ? 'bg-sky-500/5' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {item.type === 'critical' && (
                        <AlertTriangle size={15} className="text-rose-400" />
                      )}
                      {item.type === 'warning' && (
                        <AlertTriangle size={15} className="text-amber-400" />
                      )}
                      {item.type === 'info' && (
                        <Info size={15} className="text-sky-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {item.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifDropdown(false);
                    onNavigate?.('threat-intel');
                  }}
                  className="text-xs text-sky-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  View Threat Intelligence Feed
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SOC Analyst Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-sky-400/30 shadow-inner">
              SA
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-tight">
                SOC Analyst
              </span>
              <span className="text-[10px] text-sky-400/90 font-mono">
                L2 Incident Handler
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {showProfileDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 bg-[#111a2e] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-200">Bhavitra Security</div>
                <div className="text-[11px] text-slate-400 font-mono">analyst@sentinel.internal</div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onNavigate?.('settings');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  SOC Preferences
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onNavigate?.('system-status');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  Cluster Health Diagnostic
                </button>
              </div>

              <div className="border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500 font-mono">
                Role: SecOps Admin (RBAC: Full)
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
