import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLendBorrowRecord } from '../hooks/useLendBorrow';
import StatusPill from '../components/primitives/StatusPill';
import RepaymentLogModal from '../components/RepaymentLogModal';
import ChangeInterestModal from '../components/ChangeInterestModal';
import { ChevronLeft, PlusCircle, Percent, History, CheckCircle2, Calendar, Mail, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function LendBorrowDetailPage() {
  const { id } = useParams();
  const { data: record, isLoading } = useLendBorrowRecord(id);

  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="text-sm text-ink-soft p-6 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading record details...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col min-h-full space-y-6 p-6">
        <Link to="/lend-borrow" className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-sm font-medium w-fit transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Records
        </Link>
        <div className="text-sm text-negative p-4 bg-negative-soft rounded-lg border border-negative/20">
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
    ? record.totalRepaid 
    : repayments.reduce((sum, r) => {
        if (r.paymentType === 'interest_only') return sum;
        if (r.paymentType === 'principal_only' && Number(r.principalAmount) === 0) return sum + Number(r.amount);
        return sum + Number(r.principalAmount || 0);
      }, 0);

  const remaining = record.remainingBalance !== undefined 
    ? record.remainingBalance 
    : Math.max(0, amount - totalPrincipalRepaid);

  const isLent = record.type === 'lent';
  const isOverdue = new Date(record.expectedReturnDate) < new Date() && remaining > 0;
  const statusKey = remaining === 0 ? 'repaid' : (isOverdue ? 'overdue' : (totalPrincipalRepaid > 0 ? 'partial' : 'pending'));

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-12">
      
      {/* Back link */}
      <Link to="/lend-borrow" className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-sm font-medium w-fit transition-colors duration-150 group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to Ledger
      </Link>

      {/* Profile Header */}
      <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 right-0 h-[3px] accent-gradient" />

        <div className="flex flex-col space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLent ? 'bg-accent-soft' : 'bg-info-soft'}`}>
              {isLent ? <ArrowUpRight className="w-5 h-5 text-accent" /> : <ArrowDownLeft className="w-5 h-5 text-info" />}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink tracking-tight">{record.personName}</h1>
              <StatusPill status={statusKey} label={isOverdue && remaining > 0 ? 'Overdue' : null} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="inline-flex items-center gap-1.5 bg-paper-sunken px-2.5 py-1 rounded-full border border-border-default text-ink-soft">
              <Mail className="w-3 h-3 text-accent" /> {record.personEmail}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-paper-sunken px-2.5 py-1 rounded-full border border-border-default text-ink-soft">
              <Calendar className="w-3 h-3 text-accent" /> Given: {new Date(record.dateGiven).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-paper-sunken px-2.5 py-1 rounded-full border border-border-default text-ink-soft">
              <Calendar className="w-3 h-3 text-negative" /> Return: {new Date(record.expectedReturnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center self-start md:self-center">
          <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${isLent ? 'bg-accent-soft text-accent' : 'bg-info-soft text-info'}`}>
            {isLent ? 'You Lent' : 'You Borrowed'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Amount', value: amount, color: 'text-ink', accent: 'bg-accent' },
          { label: 'Interest Paid', value: totalInterestPaid, color: 'text-positive', accent: 'bg-positive' },
          { label: 'Interest Accrued', value: Number(record.interestAccrued || 0), color: 'text-warning', accent: 'bg-warning', sub: record.interestRate ? `${record.interestRate}% (${record.interestType || 'simple'})` : null },
          { label: 'Remaining', value: remaining, color: remaining === 0 ? 'text-positive' : 'text-negative', accent: remaining === 0 ? 'bg-positive' : 'bg-negative' },
        ].map((card, i) => (
          <div key={i} className="bg-paper-raised border border-border-default rounded-xl p-4 shadow-card card-hover relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full ${card.accent}`} />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint mb-1">{card.label}</p>
            <p className={`text-xl font-mono font-bold tracking-tight ${card.color}`}>₹{card.value.toLocaleString("en-IN")}</p>
            {card.sub && <span className="text-[10px] text-ink-faint font-medium mt-0.5 block">{card.sub}</span>}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 bg-paper-raised border border-border-default rounded-xl p-4 shadow-card">
        <button
          onClick={() => setIsRepayModalOpen(true)}
          className="accent-gradient hover:shadow-glow text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 btn-press"
        >
          <PlusCircle className="w-4 h-4" /> Log Transaction
        </button>

        <button
          onClick={() => setIsInterestModalOpen(true)}
          className="bg-paper-sunken hover:bg-paper border border-border-strong text-ink px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 btn-press"
        >
          <Percent className="w-4 h-4 text-accent" /> Change Interest
        </button>

        {remaining === 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-positive bg-positive-soft border border-positive/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> Fully Settled
          </span>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-paper-raised border border-border-default rounded-xl overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
              <History className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-display font-bold text-base text-ink">Transaction History ({repayments.length})</h3>
          </div>
          <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider">
            {isLent ? 'Collected' : 'Paid Back'}
          </span>
        </div>

        {repayments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-paper-sunken flex items-center justify-center mb-3">
              <History className="w-6 h-6 text-ink-faint" />
            </div>
            <p className="text-sm font-semibold text-ink-soft">No transactions recorded yet</p>
            <p className="text-xs text-ink-faint mt-1">Use the "Log Transaction" button above to record a repayment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-paper-sunken text-ink-faint font-semibold text-[10px] tracking-wider uppercase border-b border-border-default sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Allocation</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50">
                {repayments.map((rep) => {
                  const repDate = new Date(rep.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const isIntOnly = rep.paymentType === 'interest_only';
                  const isPrincInt = rep.paymentType === 'principal_interest';
                  const pAmt = Number(rep.principalAmount || 0);
                  const iAmt = Number(rep.interestAmount || (isIntOnly ? rep.amount : 0));

                  return (
                    <tr key={rep.id} className="hover:bg-accent-soft/30 transition-colors duration-100">
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono text-ink-soft text-xs">{repDate}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isIntOnly ? 'bg-warning-soft text-warning' :
                          isPrincInt ? 'bg-info-soft text-info' :
                          'bg-accent-soft text-accent'
                        }`}>
                          {isIntOnly ? 'Interest' : isPrincInt ? 'P + I' : 'Principal'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs text-ink capitalize">{rep.paymentMode || 'cash'}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono text-xs text-ink-faint">
                        {rep.transactionId ? (
                          <span className="bg-paper-sunken px-2 py-0.5 rounded-full border border-border-default text-[10px]">{rep.transactionId}</span>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right font-mono text-sm font-bold text-positive">
                        +₹{Number(rep.amount).toLocaleString("en-IN")}
                        {(isPrincInt || (pAmt > 0 && iAmt > 0)) && (
                          <span className="block text-[10px] font-normal text-ink-faint mt-0.5">
                            P: ₹{pAmt.toLocaleString()} | I: ₹{iAmt.toLocaleString()}
                          </span>
                        )}
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
