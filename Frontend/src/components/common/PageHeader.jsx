import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  badge,
  icon: Icon,
  actions,
  children,
  className = '',
}) {
  return (
    <div className={`mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
            <Icon size={22} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {(actions || children) && (
        <div className="flex items-center flex-wrap gap-2.5">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
