import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from './primitives/StatusPill';
import { ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function LendBorrowCard({ record }) {
  const navigate = useNavigate();

  const amount = Number(record.amount);
  const repaidSoFar = record.totalRepaid || 0;
  const remaining = record.remainingBalance !== undefined ? record.remainingBalance : (amount - repaidSoFar);

  const isLent = record.type === 'lent';
  const personStr = record.personName;
  const isOverdue = new Date(record.expectedReturnDate) < new Date() && remaining > 0;

  return (
    <div 
      onClick={() => navigate(`/lend-borrow/${record.id}`)}
      className="bg-paper-raised border border-border-default rounded-xl p-5 cursor-pointer card-hover flex flex-col justify-between group h-full shadow-card relative overflow-hidden"
    >
      {/* Left accent border */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-opacity duration-200 ${
        isOverdue ? 'bg-negative opacity-100' : 'accent-gradient opacity-0 group-hover:opacity-100'
      }`} />

      <div className="flex items-center justify-between">
        <StatusPill status={remaining === 0 ? 'repaid' : (isOverdue ? 'overdue' : (repaidSoFar > 0 ? 'partial' : 'pending'))} label={isOverdue && remaining > 0 ? 'Overdue' : null} />
        
        <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-faint group-hover:text-accent transition-colors duration-150">
          Details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLent ? 'bg-accent-soft' : 'bg-info-soft'}`}>
          {isLent 
            ? <ArrowUpRight className="w-4 h-4 text-accent" /> 
            : <ArrowDownLeft className="w-4 h-4 text-info" />
          }
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-ink tracking-tight group-hover:text-accent transition-colors duration-150">{personStr}</h3>
          <span className="text-[11px] text-ink-faint">{isLent ? 'You lent them' : 'You borrowed'}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-end pt-3 border-t border-border-default/50">
        <div className="flex flex-col">
          <span className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Original</span>
          <span className="text-lg font-mono font-bold text-ink tracking-tight">₹{amount.toLocaleString("en-IN")}</span>
        </div>
        
        {remaining > 0 ? (
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold mb-0.5">Pending</span>
              <span className={`text-lg font-mono font-bold tracking-tight ${isOverdue ? 'text-negative' : 'text-warning'}`}>₹{remaining.toLocaleString("en-IN")}</span>
           </div>
        ) : (
           <div className="flex flex-col items-end">
              <span className="text-[10px] text-positive font-semibold uppercase tracking-wider mb-0.5">Settled</span>
              <span className="text-sm font-mono font-bold text-positive">₹0</span>
           </div>
        )}
      </div>
    </div>
  );
}
