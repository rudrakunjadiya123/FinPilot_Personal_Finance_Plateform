import React, { useState, useRef, useEffect } from 'react';
import { useLoanSuggestions } from '../hooks/useLoans';
import { Bell, CheckCircle2, Check, X, Sparkles, Landmark } from 'lucide-react';

export default function NotificationBell() {
  const { suggestions, isLoading, acceptSuggestion, isAccepting, rejectSuggestion, isRejecting } = useLoanSuggestions();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pendingCount = suggestions?.length || 0;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative font-body" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-ink-soft hover:text-ink hover:bg-paper-sunken transition-all duration-200 btn-press"
        title="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />

        {pendingCount > 0 && (
          <>
            <span className="absolute top-2 right-2 w-2 h-2 bg-negative rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 accent-gradient text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-paper-raised">
              {pendingCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-paper-raised border border-border-default rounded-xl shadow-elevated z-50 overflow-hidden animate-slide-down">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-display font-bold text-sm text-ink">Notifications</h3>
            </div>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold bg-negative-soft text-negative px-2 py-0.5 rounded-full uppercase tracking-wider">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border-default/50">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-ink-soft flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                Checking requests...
              </div>
            ) : pendingCount === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 bg-positive-soft rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 text-positive" />
                </div>
                <h4 className="text-sm font-bold text-ink">All caught up!</h4>
                <p className="text-xs text-ink-faint">No pending confirmations right now.</p>
              </div>
            ) : (
              suggestions.map((s) => {
                const loanName = s.loan?.lenderName || `${s.loan?.loanType?.toUpperCase() || 'LOAN'} EMI`;
                const amount = Number(s.transaction?.amount || s.loan?.emiAmount || 0);

                return (
                  <div key={s.id} className="p-4 hover:bg-paper-sunken/40 transition-colors duration-100 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-ink">
                        <span className="w-7 h-7 bg-warning-soft rounded-lg flex items-center justify-center shrink-0">
                          <Landmark className="w-3.5 h-3.5 text-warning" />
                        </span>
                        <span>EMI Match Request</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-accent">₹{amount.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="bg-warning-soft/50 border border-warning/20 rounded-lg p-3 space-y-1 text-xs">
                      <div className="font-semibold text-warning flex items-center justify-between">
                        <span>Lender: {loanName}</span>
                      </div>
                      <p className="text-[11px] text-ink-soft leading-snug">{s.matchReason}</p>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed">
                      Confirm adding <strong className="text-ink font-mono">₹{amount.toLocaleString("en-IN")}</strong> to <strong className="text-ink">{loanName}</strong> schedule?
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptSuggestion(s.id)}
                        disabled={isAccepting}
                        className="flex-1 accent-gradient hover:shadow-glow text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50 btn-press"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isAccepting ? 'Confirming...' : 'Accept'}
                      </button>

                      <button
                        onClick={() => rejectSuggestion(s.id)}
                        disabled={isRejecting}
                        className="bg-paper-sunken border border-border-strong hover:border-negative text-ink-soft hover:text-negative text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 disabled:opacity-50 btn-press"
                      >
                        <X className="w-3.5 h-3.5" />
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {pendingCount > 0 && (
            <div className="p-3 bg-paper-sunken border-t border-border-default text-center text-[10px] text-ink-faint">
              Accepting updates your EMI schedule & outstanding balance.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
