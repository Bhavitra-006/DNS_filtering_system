import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search domains, IPs, sources...',
  className = '',
  autoFocus = false,
}) {
  return (
    <div className={`relative flex items-center min-w-[240px] ${className}`}>
      <Search
        size={15}
        className="absolute left-3 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="cyber-input pl-9 pr-8 py-2 text-xs w-full bg-slate-900/80 border-slate-700/80 focus:border-sky-500 rounded-md placeholder-slate-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-0.5"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
