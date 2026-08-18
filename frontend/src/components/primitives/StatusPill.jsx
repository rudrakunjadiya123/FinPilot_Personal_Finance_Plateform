import React from 'react';

export default function StatusPill({ status, label }) {
  let bgClass = "bg-paper-sunken text-ink-soft";
  let dotClass = "bg-ink-faint";

  switch(status?.toLowerCase()) {
    case 'repaid':
    case 'achieved':
    case 'paid':
    case 'completed':
      bgClass = "bg-positive-soft text-positive";
      dotClass = "bg-positive";
      break;
    case 'partial':
    case 'ahead':
    case 'on_track':
    case 'active':
      bgClass = "bg-accent-soft text-accent";
      dotClass = "bg-accent";
      break;
    case 'pending':
    case 'unpaid':
    case 'behind':
    case 'at_risk':
    case 'overdue':
      bgClass = "bg-negative-soft text-negative";
      dotClass = "bg-negative";
      break;
    case 'warning':
      bgClass = "bg-warning-soft text-warning";
      dotClass = "bg-warning";
      break;
  }

  const displayText = label || (status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ') : 'Unknown');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${bgClass} transition-colors duration-200`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {displayText}
    </span>
  );
}
