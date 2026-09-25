import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLendBorrow } from '../hooks/useLendBorrow';
import LendBorrowCard from '../components/LendBorrowCard';
import AddLendBorrowModal from '../components/AddLendBorrowModal';
import { formatCurrency } from '../utils/formatters';
import { 
  Plus, Mail, ArrowUpRight, ArrowDownLeft, TrendingUp, 
  AlertTriangle, Search, 
  Send, X, CheckCircle2, Users 
} from 'lucide-react';

export default function LendBorrowPage() {
  const { records, isLoading, sendReminder, isSendingReminder } = useLendBorrow();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState('ALL');
  const [reminderSubject, setReminderSubject] = useState('Payment Reminder from FinPilot');
  const [reminderNote, setReminderNote] = useState('Hi, this is a friendly reminder regarding our pending balance on FinPilot.');
  const [reminderSuccess, setReminderSuccess] = useState('');

  const [activeTab, setActiveTab] = useState('lent'); // 'lent' | 'borrowed'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'partial', 'repaid', 'overdue'
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  const allRecords = records || [];
  const lentRecords = allRecords.filter(r => r.type === 'lent');
  const borrowedRecords = allRecords.filter(r => r.type === 'borrowed');

  // Summary Metrics (Section 9.2)
  const summary = useMemo(() => {
    let toReceive = 0;
    let toPay = 0;
    let overdueAmt = 0;
    let interestEarned = 0;
    let interestPaid = 0;

    allRecords.forEach(r => {
      const amt = Number(r.amount || 0);
      const repaid = Number(r.totalRepaid || 0);
      const remaining = r.remainingBalance !== undefined ? Number(r.remainingBalance) : Math.max(0, amt - repaid);
      const isDuePast = r.expectedReturnDate && new Date(r.expectedReturnDate) < new Date();

      if (r.type === 'lent') {
        toReceive += remaining;
        interestEarned += Number(r.interestAccrued || 0);
        if (isDuePast && remaining > 0) overdueAmt += remaining;
      } else {
        toPay += remaining;
        interestPaid += Number(r.interestAccrued || 0);
      }
    });

    const netPosition = toReceive - toPay;

    return {
      toReceive,
      toPay,
      netPosition,
      overdueAmt,
      interestEarned,
      interestPaid
    };
  }, [allRecords]);

  // Debtors for reminder modal
  const pendingDebtors = useMemo(() => {
    return lentRecords
      .filter(r => {
        const remaining = r.remainingBalance !== undefined 
          ? Number(r.remainingBalance) 
          : (Number(r.amount) - Number(r.totalRepaid || 0));
        return remaining > 0 && r.personEmail;
      })
      .map(r => ({
        email: r.personEmail,
        name: r.personName,
        remaining: r.remainingBalance !== undefined ? Number(r.remainingBalance) : (Number(r.amount) - Number(r.totalRepaid || 0))
      }));
  }, [lentRecords]);

  // Filtered records
  const currentTabRecords = activeTab === 'lent' ? lentRecords : borrowedRecords;
  const processedRecords = useMemo(() => {
    return currentTabRecords.filter(r => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (r.personName || '').toLowerCase();
        const email = (r.personEmail || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        const amt = Number(r.amount || 0);
        const repaid = Number(r.totalRepaid || 0);
        const remaining = r.remainingBalance !== undefined ? Number(r.remainingBalance) : (amt - repaid);
        const isOverdue = r.expectedReturnDate && new Date(r.expectedReturnDate) < new Date() && remaining > 0;

        if (statusFilter === 'repaid' && remaining > 0) return false;
        if (statusFilter === 'overdue' && !isOverdue) return false;
        if (statusFilter === 'partial' && (repaid === 0 || remaining === 0)) return false;
        if (statusFilter === 'pending' && (repaid > 0 || remaining === 0)) return false;
      }
      return true;
    });
  }, [currentTabRecords, searchQuery, statusFilter]);

  const handleSendReminder = async () => {
    try {
      setReminderSuccess('');
      const res = await sendReminder({ 
        personEmail: reminderTarget,
        customSubject: reminderSubject,
        customNote: reminderNote
      });
      setReminderSuccess(res?.message || 'Reminder notification sent successfully!');
      setTimeout(() => {
        setIsReminderModalOpen(false);
        setReminderSuccess('');
      }, 1500);
    } catch {
      alert('Failed to dispatch reminder notification.');
    }
  };

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-20 font-body">
      
      {/* ── Summary Metrics Strip (Section 9.2) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Outstanding Receivable</span>
            <div className="w-7 h-7 rounded-lg bg-positive-soft flex items-center justify-center text-positive">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-positive">
            {formatCurrency(summary.toReceive)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Money owed to you</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Outstanding Payable</span>
            <div className="w-7 h-7 rounded-lg bg-negative-soft flex items-center justify-center text-negative">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-negative">
            {formatCurrency(summary.toPay)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Money you owe others</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Net Peer Position</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.netPosition >= 0 ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-mono font-bold ${
            summary.netPosition >= 0 ? 'text-positive' : 'text-negative'
          }`}>
            {formatCurrency(summary.netPosition)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">
            {summary.netPosition >= 0 ? 'Net positive asset' : 'Net peer liability'}
          </span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Overdue Receivable</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              summary.overdueAmt > 0 ? 'bg-warning-soft text-warning' : 'bg-paper-sunken text-ink-faint'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-mono font-bold ${summary.overdueAmt > 0 ? 'text-warning' : 'text-ink'}`}>
            {formatCurrency(summary.overdueAmt)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Past due date</span>
        </div>
      </div>

      {/* Topbar Actions */}
      {portalTarget && createPortal(
        <div className="flex items-center gap-2">
          {pendingDebtors.length > 0 && (
            <button 
              onClick={() => setIsReminderModalOpen(true)}
              className="bg-paper-raised border border-border-default hover:bg-paper-sunken text-ink text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-accent" />
              <span>Send Reminder</span>
            </button>
          )}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>,
        portalTarget
      )}

      {/* ── Tabs, Search & Filters Bar (Section 9.2) ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Tab Switcher */}
        <div className="flex bg-paper-sunken p-1 rounded-xl border border-border-default w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('lent')}
            className={`flex-1 md:flex-initial px-5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'lent' 
                ? 'bg-paper-raised text-accent shadow-sm' 
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Lent ({lentRecords.length})
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('borrowed')}
            className={`flex-1 md:flex-initial px-5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'borrowed' 
                ? 'bg-paper-raised text-accent shadow-sm' 
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Borrowed ({borrowedRecords.length})
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by person..."
              className="w-full bg-paper-sunken border border-border-default rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-accent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-paper-sunken border border-border-default rounded-xl px-3 py-1.5 text-xs text-ink outline-none focus:border-accent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partially Repaid</option>
            <option value="overdue">Overdue</option>
            <option value="repaid">Fully Repaid</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden w-full py-2 px-3 rounded-xl text-xs font-semibold bg-accent text-white"
          >
            + Add Record
          </button>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <div className="text-sm text-ink-soft p-12 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading peer records...</span>
        </div>
      ) : processedRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-2xl shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-display text-base font-bold text-ink">
            {searchQuery || statusFilter !== 'all' ? 'No matching records' : `No ${activeTab} records`}
          </h2>
          <p className="text-xs text-ink-soft max-w-sm">
            {searchQuery || statusFilter !== 'all'
              ? 'Try modifying your search query or status filter.'
              : `Keep clear track of money you've ${activeTab === 'lent' ? 'lent out to friends or family' : 'borrowed from others'}.`}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
          >
            + Add first record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedRecords.map((record, idx) => (
            <div key={record.id} className="animate-slide-up" style={{ animationDelay: `${Math.min(idx, 4) * 50}ms` }}>
              <LendBorrowCard record={record} />
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Add Lend/Borrow Record (Section 11) ── */}
      <AddLendBorrowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ── Modal: Send Reminders (Section 10) ── */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsReminderModalOpen(false)} />
          <div className="relative bg-paper-raised border border-border-default rounded-2xl shadow-elevated max-w-md w-full overflow-hidden p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                <h3 className="font-display font-bold text-base text-ink">Send Repayment Reminder</h3>
              </div>
              <button onClick={() => setIsReminderModalOpen(false)} className="text-ink-faint hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            {reminderSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-positive mx-auto" />
                <p className="text-xs font-semibold text-ink">{reminderSuccess}</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Select Debtor</label>
                  <select 
                    value={reminderTarget} 
                    onChange={e => setReminderTarget(e.target.value)}
                    className="w-full bg-paper-sunken border border-border-default rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-accent"
                  >
                    <option value="ALL">All Active Debtors ({pendingDebtors.length})</option>
                    {pendingDebtors.map(d => (
                      <option key={d.email} value={d.email}>
                        {d.name} ({d.email}) — {formatCurrency(d.remaining)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Subject</label>
                  <input
                    type="text"
                    value={reminderSubject}
                    onChange={e => setReminderSubject(e.target.value)}
                    className="w-full bg-paper-sunken border border-border-default rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-soft mb-1">Custom Message</label>
                  <textarea
                    rows={3}
                    value={reminderNote}
                    onChange={e => setReminderNote(e.target.value)}
                    className="w-full bg-paper-sunken border border-border-default rounded-xl p-3 text-xs text-ink outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setIsReminderModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-medium text-ink-soft hover:bg-paper-sunken rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendReminder}
                    disabled={isSendingReminder || pendingDebtors.length === 0}
                    className="px-4 py-2 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSendingReminder ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Dispatch Reminder</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
