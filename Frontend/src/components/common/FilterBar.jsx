import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function FilterBar({
  filters = [],
  onReset,
  hasActiveFilters = false,
  className = '',
}) {
  return (
    <div className={`flex items-center flex-wrap gap-2.5 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
        <Filter size={14} className="text-sky-400" />
        <span>Filters:</span>
      </div>

      {filters.map((f, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="cyber-select text-xs py-1.5 px-2.5 bg-slate-900 border-slate-700/80 text-slate-200 rounded-md focus:border-sky-500 cursor-pointer"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasActiveFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="cyber-btn cyber-btn-secondary cyber-btn-sm text-xs py-1 px-2.5 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-700"
          title="Reset all filters"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
