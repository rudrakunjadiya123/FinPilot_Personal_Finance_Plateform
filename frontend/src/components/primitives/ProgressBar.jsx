import React from 'react';

export default function ProgressBar({ current, max, labelLeft, labelRight, colorVariant = 'primary' }) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100)) || 0;
  
  const barStyles = {
    primary: 'bg-gradient-to-r from-accent to-accent-hover',
    positive: 'bg-gradient-to-r from-positive to-emerald-400',
    alert: 'bg-gradient-to-r from-negative to-red-400',
    warning: 'bg-gradient-to-r from-warning to-amber-400',
  };

  const barColor = barStyles[colorVariant] || barStyles.primary;

  return (
    <div className="w-full mt-2">
      {(labelLeft || labelRight) && (
        <div className="flex justify-between items-end mb-1.5 text-xs">
          <span className="text-ink font-medium">{labelLeft}</span>
          <span className="text-ink-soft">{labelRight}</span>
        </div>
      )}
      <div className="h-2 w-full bg-paper-sunken rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out relative`} 
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer overlay */}
          {percentage > 0 && percentage < 100 && (
            <div className="absolute inset-0 animate-shimmer rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}
