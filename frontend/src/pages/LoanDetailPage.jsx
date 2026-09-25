import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLoanDetails } from '../hooks/useLoans';
import StatusPill from '../components/primitives/StatusPill';
import EMIScheduleTable from '../components/EMIScheduleTable';
import PrepaymentSimulatorPanel from '../components/PrepaymentSimulatorPanel';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ChevronLeft, Landmark, Trash2 } from 'lucide-react';

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loan, progress, schedule, isDetailLoading, isScheduleLoading, deleteLoan, isDeleting } = useLoanDetails(id);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this loan? All associated amortization schedules will also be removed.")) {
      try {
        await deleteLoan();
        navigate('/app/loans');
      } catch (err) {
        console.error("Failed to delete loan", err);
        alert("Failed to delete loan. Please try again.");
      }
    }
  };

  if (isDetailLoading || isScheduleLoading) {
    return (
      <div className="text-sm text-ink-soft p-12 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Loading loan details and schedule...</span>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-sm text-negative p-6 bg-negative-soft rounded-2xl border border-negative/20">
        Loan obligation could not be found.
      </div>
    );
  }

  const displayTitle = (loan.loanType ? loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) : 'Personal') + ' Loan';
  const totalPrincipal = Number(loan.principalAmount || 0);
  const currentOutstanding = Number(loan.outstandingBalance || 0);
  const totalPrincipalPaid = progress?.totalPrincipalPaid || Math.max(0, totalPrincipal - currentOutstanding);
  const totalInterestPaid = progress?.totalInterestPaid || 0;
  const percentPaid = totalPrincipal > 0 ? Math.round((totalPrincipalPaid / totalPrincipal) * 100) : 0;

  // Next due installment
  const nextInstallment = (schedule || []).find(s => !s.isPaid);
  const monthlyEmi = loan.monthlyPayment || (nextInstallment 
    ? Number(nextInstallment.principalComponent || 0) + Number(nextInstallment.interestComponent || 0) 
    : 0);

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-20 font-body">
      
      {/* ── Top Navigation Bar ── */}
      <div className="flex justify-between items-center w-full">
        <Link 
          to="/app/loans" 
          className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-xs font-semibold transition-colors duration-150 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Loans</span>
        </Link>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 text-negative hover:bg-negative-soft px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 border border-negative/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isDeleting ? "Deleting..." : "Delete Loan"}</span>
        </button>
      </div>
      
      {/* ── Hero Details Card (Section 5) ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  {displayTitle}
                </h1>
                <StatusPill status={loan.status || 'active'} size="xs" />
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                {loan.lenderName || 'Scheduled Bank Obligation'} • Disbursed {formatDate(loan.startDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-soft">
              Tenure: <span className="font-bold text-ink">{loan.tenureMonths} Months</span>
            </span>
          </div>
        </div>

        {/* Primary 4 Numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Outstanding Principal</span>
            <div className="text-2xl font-mono font-bold text-negative mt-1">
              {formatCurrency(currentOutstanding)}
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Current remaining liability</span>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Monthly EMI</span>
            <div className="text-2xl font-mono font-bold text-ink mt-1">
              {monthlyEmi ? formatCurrency(monthlyEmi) : '—'}
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Principal + Interest</span>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Annual Interest Rate</span>
            <div className="text-2xl font-mono font-bold text-ink mt-1">
              {loan.interestRate}% <span className="text-xs font-normal text-ink-faint">p.a.</span>
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Standard fixed reducing</span>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Next Installment Due</span>
            <div className="text-xl font-mono font-bold text-accent mt-1">
              {nextInstallment ? formatDate(nextInstallment.dueDate) : 'All Paid'}
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Automated banking cycle</span>
          </div>
        </div>

        {/* Secondary Progress & Cumulative Payments */}
        <div className="p-4 bg-paper-sunken rounded-xl border border-border-default space-y-3">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-ink">Principal Amortization Progress</span>
            <span className="font-mono font-bold text-ink">{percentPaid}% Completed</span>
          </div>

          <div className="w-full h-2.5 bg-paper rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-700" 
              style={{ width: `${percentPaid}%` }} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <span className="text-ink-faint text-[10px] uppercase font-semibold block">Total Principal Paid</span>
              <span className="font-mono font-bold text-ink">{formatCurrency(totalPrincipalPaid)}</span>
            </div>
            <div>
              <span className="text-ink-faint text-[10px] uppercase font-semibold block">Total Interest Paid</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalInterestPaid)}</span>
            </div>
            <div>
              <span className="text-ink-faint text-[10px] uppercase font-semibold block">Sanctioned Amount</span>
              <span className="font-mono font-bold text-ink">{formatCurrency(totalPrincipal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Prepayment Simulator (Section 6) ── */}
      <PrepaymentSimulatorPanel loanId={loan.id} currentOutstanding={currentOutstanding} />

      {/* ── Amortization Schedule (Section 7) ── */}
      <EMIScheduleTable schedule={schedule} />

    </div>
  );
}
