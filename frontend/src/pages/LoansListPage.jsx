import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLoans } from '../hooks/useLoans';
import LoanCard from '../components/LoanCard';
import AddLoanModal from '../components/AddLoanModal';
import LoanSuggestionsWidget from '../components/LoanSuggestionsWidget';
import { Plus, Landmark } from 'lucide-react';

export default function LoansListPage() {
  const { loans, isLoansLoading } = useLoans();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-12">
      {/* Portalled Topbar Action */}
      {portalTarget && createPortal(
        <button 
           onClick={() => setIsModalOpen(true)}
           className="accent-gradient hover:shadow-glow text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center transition-all duration-200 btn-press"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Loan
        </button>,
        portalTarget
      )}

      <AddLoanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {isLoansLoading ? (
        <div className="text-sm text-ink-soft p-4 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          Loading your loans...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main: Loan Cards */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-accent" />
                </div>
                Active Loans ({loans?.length || 0})
              </h2>
            </div>

            {loans?.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-xl space-y-4 shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center">
                  <Landmark className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">No active loans</h3>
                <p className="text-xs text-ink-soft max-w-sm">Track personal, home, auto, or education loan EMIs and prepayments.</p>
                <button 
                   onClick={() => setIsModalOpen(true)}
                   className="accent-gradient text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-all duration-200 hover:shadow-glow btn-press"
                >
                   Add your first loan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loans?.map((loan, idx) => (
                  <div 
                    key={loan.id} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${Math.min(idx, 5) * 60}ms` }}
                  >
                    <LoanCard loan={loan} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Loan Suggestions */}
          <div className="lg:col-span-1 space-y-6">
            <LoanSuggestionsWidget />
          </div>
        </div>
      )}
    </div>
  );
}
