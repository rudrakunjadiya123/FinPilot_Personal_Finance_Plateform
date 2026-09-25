import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from './primitives/StatusPill';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useLendBorrow } from '../hooks/useLendBorrow';
import { ChevronRight, ArrowUpRight, ArrowDownLeft, Calendar, Percent, Clock, Trash2 } from 'lucide-react';

export default function LendBorrowCard({ record }) {
  const navigate = useNavigate();
  const { deleteRecord, isDeleting } = useLendBorrow();

  const handleDelete = async (e) => {
    e.stopPropagation();
    const personStr = record.personName || 'this record';
    if (window.confirm(`Are you sure you want to delete the record for "${personStr}"? All associated repayment history will also be permanently deleted.`)) {
      try {
        await deleteRecord(record.id);
      } catch (err) {
        console.error("Failed to delete record", err);
        alert("Failed to delete record. Please try again.");
      }
    }
  };

  const amount = Number(record.amount || 0);
  const repaidSoFar = Number(record.totalRepaid || 0);
  const remaining = record.remainingBalance !== undefined ? Number(record.remainingBalance) : Math.max(0, amount - repaidSoFar);

  const isLent = record.type === 'lent';
  const personStr = record.personName || 'Unnamed Counterparty';

  const dueDate = record.expectedReturnDate ? new Date(record.expectedReturnDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && remaining > 0;
  const daysOverdue = isOverdue ? Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24)) : 0;

  const progressPercent = amount > 0 ? Math.min(100, Math.round((repaidSoFar / amount) * 100)) : 0;

  let computedStatus = 'pending';
  if (remaining === 0) computedStatus = 'repaid';
  else if (isOverdue) computedStatus = 'overdue';
  else if (repaidSoFar > 0) computedStatus = 'partial';

  return (
    <div 
      onClick={() => navigate(`/app/lend-borrow/${record.id}`)}
      className="bg-paper-raised border border-border-default rounded-2xl p-5 cursor-pointer hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group shadow-card relative overflow-hidden"
    >
      <div>
        {/* Top Status & Type Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <StatusPill status={computedStatus} size="xs" />
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete record"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-ink-faint hover:text-negative hover:bg-negative-soft transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:underline">
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Counterparty Identity */}
        <div className="flex items-center gap-3 my-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isLent ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
          }`}>
            {isLent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm font-bold text-ink tracking-tight truncate group-hover:text-accent transition-colors">
              {personStr}
            </h3>
            <span className="text-[11px] text-ink-soft block truncate">
              {isLent ? 'You lent money to them' : 'You borrowed from them'}
            </span>
          </div>
        </div>

        {/* Financial Amounts Box */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-paper-sunken rounded-xl border border-border-default">
          <div>
            <span className="text-[10px] text-ink-faint uppercase font-semibold block">Principal</span>
            <span className="text-sm font-mono font-bold text-ink mt-0.5 block">
              {formatCurrency(amount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-ink-faint uppercase font-semibold block">
              {isLent ? 'To Receive' : 'To Pay Back'}
            </span>
            <span className={`text-sm font-mono font-bold mt-0.5 block ${
              remaining === 0 ? 'text-positive' : isOverdue ? 'text-negative' : 'text-ink'
            }`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>

        {/* Repayment Progress */}
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-[11px] text-ink-soft">
            <span>Repaid: {formatCurrency(repaidSoFar)}</span>
            <span className="font-mono font-semibold text-ink">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-paper-sunken rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                remaining === 0 ? 'bg-positive' : isOverdue ? 'bg-negative' : 'bg-accent'
              }`}
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Footer Info: Due Date / Overdue Tag */}
      <div className="pt-3 border-t border-border-default flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-ink-soft">
          <Calendar className="w-3.5 h-3.5 text-ink-faint" />
          <span>{record.expectedReturnDate ? formatDate(record.expectedReturnDate) : 'No due date'}</span>
        </div>

        {isOverdue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-negative bg-negative-soft px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            {daysOverdue}d overdue
          </span>
        )}

        {Number(record.interestRate) > 0 && !isOverdue && (
          <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-ink-soft bg-paper-sunken px-2 py-0.5 rounded-md border border-border-default">
            <Percent className="w-2.5 h-2.5" />
            {record.interestRate}%
          </span>
        )}
      </div>
    </div>
  );
}
