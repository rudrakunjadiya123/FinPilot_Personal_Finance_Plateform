import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLoans } from '../hooks/useLoans';
import LoanCard from '../components/LoanCard';
import AddLoanModal from '../components/AddLoanModal';
import LoanSuggestionsWidget from '../components/LoanSuggestionsWidget';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, Landmark, Search, 
  CreditCard, Calendar, Percent, ShieldCheck 
} from 'lucide-react';

export default function LoansListPage() {
  const { loans, isLoansLoading } = useLoans();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'repaid'
  const [sortBy, setSortBy] = useState('balance_desc'); // 'balance_desc', 'balance_asc', 'rate_desc', 'tenure_asc'

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  // Summary Metrics (Section 4)
  const summary = useMemo(() => {
    const list = loans || [];
    const totalCount = list.length;
    let totalOutstanding = 0;
    let totalEmi = 0;
    let weightedRateSum = 0;

    list.forEach(l => {
      const out = Number(l.outstandingBalance || 0);
      totalOutstanding += out;
      totalEmi += Number(l.monthlyPayment || 0);
      weightedRateSum += Number(l.interestRate || 0) * out;
    });

    const avgRate = totalOutstanding > 0 ? (weightedRateSum / totalOutstanding).toFixed(1) : 0;

    return {
      totalCount,
      totalOutstanding,
      totalEmi,
      avgRate
    };
  }, [loans]);

  // Filtered & Sorted Loans
  const processedLoans = useMemo(() => {
    return (loans || [])
      .filter(l => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const title = (l.loanType || '').toLowerCase();
          const lender = (l.lenderName || '').toLowerCase();
          if (!title.includes(q) && !lender.includes(q)) return false;
        }
        // Type
        if (typeFilter !== 'all') {
          if (l.loanType?.toLowerCase() !== typeFilter.toLowerCase()) return false;
        }
        // Status
        if (statusFilter !== 'all') {
          if (statusFilter === 'active' && l.status === 'repaid') return false;
          if (statusFilter === 'repaid' && l.status !== 'repaid') return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'balance_desc') return Number(b.outstandingBalance || 0) - Number(a.outstandingBalance || 0);
        if (sortBy === 'balance_asc') return Number(a.outstandingBalance || 0) - Number(b.outstandingBalance || 0);
        if (sortBy === 'rate_desc') return Number(b.interestRate || 0) - Number(a.interestRate || 0);
        if (sortBy === 'tenure_asc') return Number(a.tenureMonths || 0) - Number(b.tenureMonths || 0);
        return 0;
      });
  }, [loans, searchQuery, typeFilter, statusFilter, sortBy]);

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-20 font-body">
      {/* Portalled Topbar Action */}
      {portalTarget && createPortal(
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all duration-150"
        >
          <Plus className="w-4 h-4" /> Add Loan
        </button>,
        portalTarget
      )}

      <AddLoanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ── Summary Strip (Section 4) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Active Loans</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-soft flex items-center justify-center text-neutral">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">{summary.totalCount}</div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Managed liabilities</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Total Debt Balance</span>
            <div className="w-7 h-7 rounded-lg bg-negative-soft flex items-center justify-center text-negative">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-negative">
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Outstanding principal</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Monthly Total EMI</span>
            <div className="w-7 h-7 rounded-lg bg-info-soft flex items-center justify-center text-info">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">
            {formatCurrency(summary.totalEmi)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Scheduled monthly debit</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Avg Interest Rate</span>
            <div className="w-7 h-7 rounded-lg bg-info-soft flex items-center justify-center text-info">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">
            {summary.avgRate}%
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Weighted annual rate</span>
        </div>
      </div>

      {/* ── Search, Filter & Controls Bar ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by loan type or bank..."
            className="w-full bg-paper-sunken border border-border-default rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-paper-sunken border border-border-default rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-accent"
          >
            <option value="all">All Loan Types</option>
            <option value="home">Home Loan</option>
            <option value="education">Education Loan</option>
            <option value="personal">Personal Loan</option>
            <option value="vehicle">Auto / Vehicle</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-paper-sunken border border-border-default rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-accent"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="repaid">Repaid</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-paper-sunken border border-border-default rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-accent"
          >
            <option value="balance_desc">Highest Balance</option>
            <option value="balance_asc">Lowest Balance</option>
            <option value="rate_desc">Highest Interest Rate</option>
            <option value="tenure_asc">Shortest Tenure</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden w-full py-2 px-4 rounded-xl text-xs font-semibold bg-accent text-white"
          >
            + Add Loan
          </button>
        </div>
      </div>

      {isLoansLoading ? (
        <div className="text-sm text-ink-soft p-12 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading loan obligations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main: Loan Cards List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-soft">
                Showing {processedLoans.length} of {loans?.length || 0} Loans
              </span>
            </div>

            {processedLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-2xl space-y-3 shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-bold text-ink">
                  {searchQuery || typeFilter !== 'all' ? 'No matching loans found' : 'No active loans'}
                </h3>
                <p className="text-xs text-ink-soft max-w-sm">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'Try adjusting your search query or filter settings.' 
                    : 'Track personal, home, auto, or education loan EMIs and prepayments.'}
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-accent hover:bg-accent-hover text-white font-medium py-2 px-5 rounded-xl text-xs shadow-sm transition-all"
                >
                  Add your first loan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedLoans.map((loan, idx) => (
                  <div key={loan.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(idx, 4) * 50}ms` }}>
                    <LoanCard loan={loan} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel: Suggestions & Debt Insights */}
          <div className="lg:col-span-1 space-y-5">
            <LoanSuggestionsWidget />

            <div className="bg-paper-raised border border-border-default rounded-2xl p-5 shadow-card space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <h4 className="font-display font-bold text-sm text-ink">Smart Prepayment Strategy</h4>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                Prioritize loans with the highest interest rates first. Even a small lump-sum prepayment of ₹25,000 can reduce multiple months off your tenure.
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-accent font-medium">
                  Select any loan card to access the real-time Prepayment Simulator.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
