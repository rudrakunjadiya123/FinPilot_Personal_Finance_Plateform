import React from 'react';

export default function StatusPill({ status, label, size = 'sm' }) {
  let bgClass = "bg-paper-sunken text-ink-soft border-border-default";
  let dotClass = "bg-ink-faint";

  const s = status?.toLowerCase()?.replace(/\s+/g, '_') || '';

  switch (s) {
    // Positive / Completed / On Track
    case 'repaid':
    case 'achieved':
    case 'paid':
    case 'completed':
    case 'on_track':
    case 'ahead':
    case 'active':
    case 'healthy':
    case 'verified':
      bgClass = "bg-positive-soft text-positive border-positive/20";
      dotClass = "bg-positive";
      break;

    // Warning / Attention Needed / At Risk / Partial
    case 'at_risk':
    case 'partial':
    case 'due_soon':
    case 'review_required':
    case 'needs_review':
    case 'warning':
    case 'pending':
      bgClass = "bg-warning-soft text-warning border-warning/20";
      dotClass = "bg-warning";
      break;

    // Negative / Overdue / Off Track / Failed
    case 'unpaid':
    case 'behind':
    case 'off_track':
    case 'overdue':
    case 'failed':
    case 'critical':
    case 'deficit':
      bgClass = "bg-negative-soft text-negative border-negative/20";
      dotClass = "bg-negative";
      break;

    // Informational / Upcoming
    case 'upcoming':
    case 'info':
    case 'scheduled':
    case 'processing':
      bgClass = "bg-info-soft text-info border-info/20";
      dotClass = "bg-info";
      break;

    // AI / Intelligence
    case 'ai':
    case 'analyzing':
    case 'recommended':
    case 'auto_matched':
      bgClass = "bg-purple-soft text-purple border-purple/20";
      dotClass = "bg-purple";
      break;

    default:
      bgClass = "bg-neutral-soft text-neutral border-neutral/20";
      dotClass = "bg-neutral";
      break;
  }

  // Format label cleanly: "on_track" -> "On Track", "at_risk" -> "At Risk"
  const displayText = label || (s ? s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown');

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-[11px]';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizeClasses} ${bgClass} transition-colors duration-150 shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />
      <span>{displayText}</span>
    </span>
  );
}
