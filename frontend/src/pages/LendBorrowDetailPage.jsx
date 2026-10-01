import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLendBorrowRecord } from '../hooks/useLendBorrow';
import StatusPill from '../components/primitives/StatusPill';
import RepaymentLogModal from '../components/RepaymentLogModal';
import ChangeInterestModal from '../components/ChangeInterestModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  ChevronLeft, PlusCircle, Percent, History, 
  Calendar, Mail, ArrowUpRight, ArrowDownLeft, Clock, Trash2 
} from 'lucide-react';

export default function LendBorrowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: record, isLoading, deleteRecord, isDeleting } = useLendBorrowRecord(id);

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);

  const handleDelete = async () => {
    const personName = record?.personName || 'this record';
    if (window.confirm(`Are you sure you want to delete the record for "${personName}"? All logged repayment history for this transaction will be permanently removed.`)) {
      try {
        await deleteRecord();
        navigate('/app/lend-borrow');
      } catch (err) {
        console.error("Failed to delete record", err);
        alert("Failed to delete record. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-ink-soft p-12 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Loading ledger record...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col min-h-full space-y-6 pb-12">
        <Link to="/app/lend-borrow" className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-xs font-semibold w-fit transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Records</span>
        </Link>
        <div className="text-sm text-negative p-6 bg-negative-soft rounded-2xl border border-negative/20">
          Record not found or access denied.
        </div>
      </div>
    );
  }

  const amount = Number(record.amount || 0);
  const repayments = record.repayments || [];
  
  const totalInterestPaid = repayments.reduce((sum, r) => {
    if (r.paymentType === 'interest_only') return sum + Number(r.amount);
    return sum + Number(r.interestAmount || 0);
  }, 0);

  const totalPrincipalRepaid = record.totalRepaid !== undefined 
    ? Number(record.totalRepaid) 
    : repayments.reduce((sum, r) => {
        if (r.paymentType === 'interest_only') return sum;
        if (r.paymentType === 'principal_only' && Number(r.principalAmount) === 0) return sum + Number(r.amount);
        return sum + Number(r.principalAmount || 0);
      }, 0);

  const remaining = record.remainingBalance !== undefined 
    ? Number(record.remainingBalance) 
    : Math.max(0, amount - totalPrincipalRepaid);

  const isLent = record.type === 'lent';
  const dueDate = record.expectedReturnDate ? new Date(record.expectedReturnDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && remaining > 0;
  const statusKey = remaining === 0 ? 'repaid' : (isOverdue ? 'overdue' : (totalPrincipalRepaid > 0 ? 'partial' : 'pending'));

  const progressPercent = amount > 0 ? Math.min(100, Math.round((totalPrincipalRepaid / amount) * 100)) : 0;

  let displayInterestRate = Number(record.interestRate || 0);
  let displayInterestType = record.interestType || 'none';

  if (Array.isArray(record.interestRateHistory) && record.interestRateHistory.length > 0) {
    const sorted = [...record.interestRateHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1];
    if (latest && latest.rate !== undefined && latest.rate !== null) {
      displayInterestRate = Number(latest.rate);
    }
    if (latest && latest.interestType) {
      displayInterestType = latest.interestType;
    }
  }

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-20 font-body">
      
      {/* ── Top Navigation Bar ── */}
      <div className="flex justify-between items-center w-full">
        <Link 
          to="/app/lend-borrow" 
          className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-xs font-semibold transition-colors duration-150 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Peer Ledger</span>
        </Link>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 text-negative hover:bg-negative-soft px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 border border-negative/20 hover:border-negative/40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isDeleting ? "Deleting..." : "Delete Record"}</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isLent ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
            }`}>
              {isLent ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  {record.personName}
                </h1>
                <StatusPill status={statusKey} size="xs" />
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                {isLent ? 'You lent money to this individual' : 'You borrowed money from this individual'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {record.personEmail && (
              <span className="inline-flex items-center gap-1.5 bg-paper-sunken px-3 py-1 rounded-xl border border-border-default text-ink-soft font-mono">
                <Mail className="w-3.5 h-3.5 text-accent" /> {record.personEmail}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-paper-sunken px-3 py-1 rounded-xl border border-border-default text-ink-soft">
              <Calendar className="w-3.5 h-3.5 text-accent" /> Disbursed: {formatDate(record.dateGiven)}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-paper-sunken px-3 py-1 rounded-xl border border-border-default text-ink-soft">
              <Clock className="w-3.5 h-3.5 text-negative" /> Due: {record.expectedReturnDate ? formatDate(record.expectedReturnDate) : 'Open'}
            </span>
          </div>
        </div>

        {/* 4 Numbers Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Total Principal</span>
            <div className="text-2xl font-mono font-bold text-ink mt-1">
              {formatCurrency(amount)}
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Original sanctioned sum</span>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">
              {isLent ? 'Pending Receivable' : 'Pending Payable'}
            </span>
            <div className={`text-2xl font-mono font-bold mt-1 ${
              remaining === 0 ? 'text-positive' : isOverdue ? 'text-negative' : 'text-ink'
            }`}>
              {formatCurrency(remaining)}
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">
              {remaining === 0 ? 'Zero outstanding' : 'Remaining balance'}
            </span>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Interest Rate</span>
            <div className="text-2xl font-mono font-bold text-ink mt-1">
              {displayInterestRate}% <span className="text-xs font-normal text-ink-faint">({displayInterestType})</span>
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Accrued: {formatCurrency(record.interestAccrued || 0)}</span>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Interest Paid</span>
            <div className="text-2xl font-mono font-bold text-positive mt-1">
              {formatCurrency(totalInterestPaid)}
            </div>
            <span className="text-[10px] text-ink-soft mt-0.5 block">Cumulative interest serviced</span>
          </div>
        </div>

        {/* Repayment Progress Bar */}
        <div className="p-4 bg-paper-sunken rounded-xl border border-border-default space-y-2">
          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-ink">Settlement Progress</span>
            <span className="font-mono font-bold text-ink">{progressPercent}% ({formatCurrency(totalPrincipalRepaid)} Repaid)</span>
          </div>
          <div className="w-full h-2.5 bg-paper rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                remaining === 0 ? 'bg-positive' : isOverdue ? 'bg-negative' : 'bg-accent'
              }`}
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => setIsRepayModalOpen(true)}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Record Repayment
          </button>

          <button
            onClick={() => setIsInterestModalOpen(true)}
            className="bg-paper-sunken hover:bg-paper-raised border border-border-default text-ink px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Percent className="w-3.5 h-3.5 text-accent" /> Modify Interest
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-negative hover:bg-negative-soft border border-negative/20 hover:border-negative/40 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-paper-raised border border-border-default rounded-2xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-base text-ink">
              Repayment History ({repayments.length})
            </h3>
          </div>
          <span className="text-xs text-ink-soft">
            {isLent ? 'Funds Received' : 'Funds Returned'}
          </span>
        </div>

        {repayments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <History className="w-8 h-8 text-ink-faint mb-2" />
            <p className="text-xs font-medium text-ink-soft">No repayment transactions logged yet.</p>
            <p className="text-[11px] text-ink-faint mt-0.5">Use "Record Repayment" to log incoming or outgoing installments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-paper-sunken text-ink-faint font-semibold uppercase tracking-wider border-b border-border-default sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-paper-raised text-ink">
                {repayments.map((rep) => {
                  const isIntOnly = rep.paymentType === 'interest_only';
                  const isPrincInt = rep.paymentType === 'principal_interest';

                  return (
                    <tr key={rep.id} className="hover:bg-paper-sunken/60 transition-colors">
                      <td className="px-6 py-3 font-mono text-ink-soft">{formatDate(rep.date)}</td>
                      <td className="px-6 py-3">
                        <StatusPill 
                          status={isIntOnly ? 'info' : 'paid'} 
                          label={isIntOnly ? 'Interest Only' : isPrincInt ? 'Principal + Interest' : 'Principal Only'}
                          size="xs" 
                        />
                      </td>
                      <td className="px-6 py-3 font-mono capitalize">{rep.paymentMode || 'Direct Cash'}</td>
                      <td className="px-6 py-3 font-mono text-ink-faint">
                        {rep.transactionId ? (
                          <span className="bg-paper-sunken px-2 py-0.5 rounded border border-border-default text-[10px]">
                            {rep.transactionId}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-positive text-sm">
                        +{formatCurrency(rep.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RepaymentLogModal isOpen={isRepayModalOpen} onClose={() => setIsRepayModalOpen(false)} record={record} remaining={remaining} />
      <ChangeInterestModal isOpen={isInterestModalOpen} onClose={() => setIsInterestModalOpen(false)} record={record} />
    </div>
  );
}
