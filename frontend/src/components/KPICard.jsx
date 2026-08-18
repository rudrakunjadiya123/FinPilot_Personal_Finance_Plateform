import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ label, value, trend, isCurrency = true, icon: Icon }) {
  const [prevValue, setPrevValue] = useState(value);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (value !== prevValue && value !== undefined) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      setPrevValue(value);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend?.direction === 'up' ? 'text-green-600' : trend?.direction === 'down' ? 'text-red-500' : 'text-ink-faint';
  const trendBg = trend?.direction === 'up' ? 'bg-green-50 dark:bg-green-950/40' : trend?.direction === 'down' ? 'bg-red-50 dark:bg-red-950/40' : 'bg-paper-sunken';
  const valueColor = trend?.direction === 'up' ? 'text-green-700 dark:text-green-400' : trend?.direction === 'down' ? 'text-red-600 dark:text-red-400' : 'text-ink';

  return (
    <div className="bg-paper-raised border border-border-default rounded-xl p-5 flex flex-col justify-between h-[150px] shadow-card card-hover relative overflow-hidden group">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300 ${highlight ? 'accent-gradient opacity-100' : 'bg-transparent opacity-0 group-hover:opacity-100'}`}
        style={{ background: highlight || undefined ? 'var(--color-accent-gradient, var(--color-accent))' : undefined }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-faint uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
            <Icon className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <span className="text-2xl font-mono font-bold tracking-tight text-ink">
          {isCurrency ? `₹${Number(value || 0).toLocaleString("en-IN")}` : value}
        </span>
      </div>

      {trend && (
        <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${trendBg} ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
