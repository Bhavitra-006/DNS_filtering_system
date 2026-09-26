import React from 'react';

export default function StatusBadge({ type = 'decision', value, label, size = 'sm', className = '' }) {
  if (!value && !label) return null;

  const display = label || value;
  const valUpper = String(value || label).toUpperCase();

  if (type === 'decision') {
    let badgeClass = 'badge-allow';
    if (valUpper === 'BLOCK') badgeClass = 'badge-block';
    if (valUpper === 'FLAG') badgeClass = 'badge-flag';

    return (
      <span className={`status-badge ${badgeClass} ${className}`}>
        <span className="dot"></span>
        {display}
      </span>
    );
  }

  if (type === 'system') {
    let badgeClass = 'badge-online';
    if (valUpper === 'DEGRADED' || valUpper === 'WARNING') badgeClass = 'badge-degraded';
    if (valUpper === 'OFFLINE' || valUpper === 'CRITICAL') badgeClass = 'badge-offline';

    return (
      <span className={`status-badge ${badgeClass} ${className}`}>
        <span className="dot"></span>
        {display}
      </span>
    );
  }

  if (type === 'queryType') {
    return (
      <span className={`badge-qtype ${className}`}>
        {display}
      </span>
    );
  }

  if (type === 'threat') {
    const threatLower = String(display).toLowerCase();
    let styleClass = 'text-sky-400 bg-sky-500/10 border-sky-500/20';

    if (threatLower.includes('phish')) {
      styleClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (threatLower.includes('malware') || threatLower.includes('c2')) {
      styleClass = 'text-red-400 bg-red-500/10 border-red-500/30';
    } else if (threatLower.includes('dga')) {
      styleClass = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    } else if (threatLower.includes('tunnel')) {
      styleClass = 'text-pink-400 bg-pink-500/10 border-pink-500/30';
    } else if (threatLower.includes('suspicious')) {
      styleClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (threatLower.includes('clean') || threatLower.includes('none') || threatLower.includes('benign')) {
      styleClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (threatLower.includes('botnet')) {
      styleClass = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    }

    return (
      <span className={`badge-threat ${styleClass} ${className}`}>
        {display}
      </span>
    );
  }

  return (
    <span className={`status-badge bg-slate-800 text-slate-300 border-slate-700 ${className}`}>
      {display}
    </span>
  );
}
