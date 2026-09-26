import React from 'react';

export default function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footer,
  ...props
}) {
  return (
    <div className={`soc-card ${className}`} {...props}>
      {(title || Icon || action) && (
        <div className={`soc-card-header ${headerClassName}`}>
          <div className="soc-card-title">
            {Icon && <Icon size={18} className="text-sky-400" />}
            <div>
              <div className="flex items-center gap-2">
                <span>{title}</span>
              </div>
              {subtitle && (
                <div className="text-xs text-slate-400 font-normal mt-0.5">{subtitle}</div>
              )}
            </div>
          </div>
          {action && <div className="card-action-slot">{action}</div>}
        </div>
      )}
      <div className={`soc-card-body ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/40 text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
}
