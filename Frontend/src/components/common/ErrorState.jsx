import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Failed to Load Intelligence Data',
  message = 'An unexpected connection issue occurred while syncing with the local DNS engine.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
        <AlertTriangle size={26} />
      </div>
      <h3 className="text-sm font-semibold text-rose-300">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" icon={RotateCcw} onClick={onRetry}>
          Retry Connection
        </Button>
      )}
    </div>
  );
}
