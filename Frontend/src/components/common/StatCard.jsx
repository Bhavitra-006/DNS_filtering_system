import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subValue,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral', 'good', 'bad'
  icon: Icon,
  iconColor = 'text-sky-400',
  iconBg = 'bg-sky-500/10',
  statusBadge,
  footer,
  className = '',
}) {
  const getChangeColor = () => {
    if (changeType === 'good' || changeType === 'positive') return 'text-emerald-400';
    if (changeType === 'bad' || changeType === 'negative') return 'text-rose-400';
    return 'text-slate-400';
  };

  const renderChangeIcon = () => {
    if (!change) return null;
    if (change.startsWith('+')) return <ArrowUpRight size={13} className="inline mr-0.5" />;
    if (change.startsWith('-')) return <ArrowDownRight size={13} className="inline mr-0.5" />;
    return <Minus size={13} className="inline mr-0.5" />;
  };

  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{title}</span>
        {Icon && (
          <div className={`stat-card-icon ${iconBg} ${iconColor}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="stat-card-value">{value}</div>
        {statusBadge && <div>{statusBadge}</div>}
      </div>

      {(change || subValue || footer) && (
        <div className="stat-card-meta">
          {change && (
            <span className={`font-medium flex items-center ${getChangeColor()}`}>
              {renderChangeIcon()}
              {change}
            </span>
          )}
          {subValue && <span>{subValue}</span>}
          {footer && <span>{footer}</span>}
        </div>
      )}
    </div>
  );
}
