import React from 'react';
import { useLoanSuggestions } from '../hooks/useLoans';
import { AlertCircle, Check, X, Sparkles, Landmark } from 'lucide-react';

export default function LoanSuggestionsWidget() {
  const { suggestions, isLoading, acceptSuggestion, isAccepting, rejectSuggestion, isRejecting } = useLoanSuggestions();

  if (isLoading || !suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-warning-soft/50 border border-warning/20 rounded-xl p-5 space-y-3 font-body shadow-card mb-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
          <div className="w-7 h-7 rounded-lg bg-warning-soft flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-warning" />
          </div>
          <span>EMI Detection ({suggestions.length})</span>
        </div>
        <span className="text-[10px] bg-warning-soft text-warning px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-warning/20">
          Pending
        </span>
      </div>

      <div className="space-y-2.5">
        {suggestions.map((item) => {
          const loanName = item.loan ? `${item.loan.loanType.toUpperCase()} Loan` : 'Loan';
          const lender = item.loan?.lenderName || item.loan?.notes || 'Lender';
          const txAmt = Number(item.transaction?.amount || 0);
          const txDesc = item.transaction?.descriptionRaw || '';
          const txDate = item.transaction?.date ? new Date(item.transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

          return (
            <div key={item.id} className="bg-paper-raised p-3.5 rounded-lg border border-border-default space-y-2.5 text-xs card-hover">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                    <Landmark className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink text-xs">{lender} — {loanName}</h4>
                    <p className="text-[10px] text-ink-faint mt-0.5 line-clamp-1" title={txDesc}>
                      "{txDesc}" on {txDate}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-bold text-accent text-sm ml-2 shrink-0">
                  ₹{txAmt.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="text-[10px] text-warning bg-warning-soft/60 px-2.5 py-1.5 rounded-lg border border-warning/10 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 text-warning shrink-0" />
                <span>{item.matchReason}</span>
              </div>

              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  disabled={isAccepting || isRejecting}
                  onClick={() => acceptSuggestion(item.id)}
                  className="flex-1 accent-gradient hover:shadow-glow text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 btn-press"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  type="button"
                  disabled={isAccepting || isRejecting}
                  onClick={() => rejectSuggestion(item.id)}
                  className="bg-paper-sunken hover:bg-paper border border-border-strong hover:border-negative text-ink-soft hover:text-negative font-semibold py-2 px-3 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1 disabled:opacity-50 btn-press"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
