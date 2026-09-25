import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from './primitives/StatusPill';
import { formatCurrency } from '../utils/formatters';
import { ChevronRight, Percent, Calendar, Landmark } from 'lucide-react';

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  const total = Number(loan.principalAmount || 0);
  const currentOut = Number(loan.outstandingBalance || 0);
  const paid = Math.max(0, total - currentOut);
  const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
  const displayTitle = (loan.loanType ? loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) : 'Personal') + ' Loan';

  return (
    <div 
      onClick={() => navigate(`/app/loans/${loan.id}`)}
      className="bg-paper-raised border border-border-default rounded-2xl p-5 cursor-pointer hover:shadow-elevated transition-all duration-200 flex flex-col justify-between group shadow-card relative overflow-hidden"
    >
      {/* Top Header */}
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-ink tracking-tight truncate group-hover:text-accent transition-colors">
                {displayTitle}
              </h3>
              <span className="text-[11px] text-ink-soft truncate block">
                {loan.lenderName || 'Scheduled Bank Debt'}
              </span>
            </div>
          </div>
          <StatusPill status={loan.status || 'active'} size="xs" />
        </div>

        {/* Balance & EMI Info */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-paper-sunken rounded-xl border border-border-default">
          <div>
            <span className="text-[10px] text-ink-faint uppercase font-semibold block">Outstanding</span>
            <span className="text-base font-mono font-bold text-ink mt-0.5 block">
              {formatCurrency(currentOut)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-ink-faint uppercase font-semibold block">Monthly EMI</span>
            <span className="text-base font-mono font-bold text-ink mt-0.5 block">
              {loan.monthlyPayment ? formatCurrency(loan.monthlyPayment) : '—'}
            </span>
          </div>
        </div>

        {/* Repayment Progress */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between text-xs font-medium text-ink">
            <span className="text-ink-soft">Principal Repaid</span>
            <span className="font-mono font-bold text-ink">{percentPaid}%</span>
          </div>
          <div className="w-full h-2 bg-paper-sunken rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-500" 
              style={{ width: `${percentPaid}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] text-ink-faint font-mono">
            <span>{formatCurrency(paid)} paid</span>
            <span>of {formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer Details & Action Button */}
      <div className="pt-3 border-t border-border-default flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-[11px] text-ink-soft">
          <span className="inline-flex items-center gap-1 font-mono font-semibold">
            <Percent className="w-3 h-3 text-accent" />
            {loan.interestRate}% p.a.
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3 text-ink-faint" />
            {loan.tenureMonths}m
          </span>
        </div>

        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/loans/${loan.id}`);
          }}
          className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
