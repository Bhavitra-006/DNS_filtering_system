import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function LoadingState({
  title = 'Scanning DNS Stream...',
  message = 'Retrieving threat records and real-time logs from engine',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-sky-400">
          <RefreshCw size={16} className="animate-pulse" />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
    </div>
  );
}
