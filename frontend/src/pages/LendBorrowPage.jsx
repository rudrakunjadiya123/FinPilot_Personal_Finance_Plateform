import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLendBorrow } from '../hooks/useLendBorrow';
import LendBorrowCard from '../components/LendBorrowCard';
import AddLendBorrowModal from '../components/AddLendBorrowModal';
import { Plus, Mail, ArrowUpRight, ArrowDownLeft, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

export default function LendBorrowPage() {
  const { records, isLoading, sendReminder, isSendingReminder } = useLendBorrow();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState('ALL');
  
  const [activeTab, setActiveTab] = useState('lent');
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  const lentRecords = records?.filter(r => r.type === 'lent') || [];
  const borrowedRecords = records?.filter(r => r.type === 'borrowed') || [];
  const activeRecords = activeTab === 'lent' ? lentRecords : borrowedRecords;

  const distinctDebtors = Array.from(new Set(lentRecords.filter(r => r.status !== 'repaid').map(r => r.personEmail)));

  const totalLent = records?.filter(r => r.type === 'lent').reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const totalBorrowed = records?.filter(r => r.type === 'borrowed').reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  const netLending = totalLent - totalBorrowed;
  const interestEarned = records?.filter(r => r.type === 'lent').reduce((sum, r) => sum + Number(r.interestAccrued || 0), 0) || 0;
  const interestPaid = records?.filter(r => r.type === 'borrowed').reduce((sum, r) => sum + Number(r.interestAccrued || 0), 0) || 0;
  const totalOverdue = records?.filter(r => r.isOverdue).reduce((sum, r) => sum + Number(r.remainingBalance || 0), 0) || 0;

  const handleSendReminder = async () => {
    try {
      const res = await sendReminder({ personEmail: reminderTarget });
      alert(res.message || "Reminders sent!");
      setIsReminderModalOpen(false);
    } catch (e) {
      alert("Failed to send reminder.");
    }
  };

  const kpiStats = [
    { label: 'Money Lent', value: totalLent, icon: ArrowUpRight, color: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Money Borrowed', value: totalBorrowed, icon: ArrowDownLeft, color: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Net Lending', value: netLending, icon: TrendingUp, color: netLending >= 0 ? 'text-emerald-600' : 'text-red-500', iconBg: netLending >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40' },
    { label: 'Interest Earned', value: interestEarned, icon: DollarSign, color: 'text-green-600', iconBg: 'bg-green-50 dark:bg-green-950/40' },
    { label: 'Interest Paid', value: interestPaid, icon: DollarSign, color: 'text-red-500', iconBg: 'bg-red-50 dark:bg-red-950/40' },
    { label: 'Overdue', value: totalOverdue, icon: AlertTriangle, color: totalOverdue > 0 ? 'text-red-500' : 'text-ink-soft', iconBg: totalOverdue > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-slate-50 dark:bg-slate-800/40' },
  ];

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* KPI Banner */}
      {!isLoading && records && records.length > 0 && (
        <div className="bg-paper-raised border border-border-default rounded-xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 p-1 mb-6 shadow-card gap-1">
          {kpiStats.map((stat, i) => (
            <div key={i} className="p-3 rounded-lg hover:bg-paper-sunken transition-colors duration-150 text-center">
              <div className={`w-8 h-8 rounded-full ${stat.iconBg} flex items-center justify-center mx-auto mb-1.5`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="block text-[10px] text-ink-faint uppercase tracking-wider font-semibold">{stat.label}</span>
              <span className={`font-mono text-lg font-bold ${stat.color}`}>
                ₹{stat.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Topbar Actions */}
      {portalTarget && createPortal(
        <div className="flex items-center gap-2">
          <button 
             onClick={() => setIsReminderModalOpen(true)}
             className="bg-paper-sunken border border-border-strong hover:border-accent text-ink text-sm font-semibold py-2 px-4 rounded-lg flex items-center transition-all duration-200 btn-press"
          >
            <Mail className="w-4 h-4 mr-1.5" /> Remind
          </button>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="accent-gradient hover:shadow-glow text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center transition-all duration-200 btn-press"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Record
          </button>
        </div>,
        portalTarget
      )}

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setIsReminderModalOpen(false)} />
          <div className="relative bg-paper-raised border border-border-default rounded-xl shadow-elevated max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="h-[3px] w-full accent-gradient" />
            <div className="p-6">
              <h2 className="text-lg font-display font-bold text-ink mb-1">Send Reminders</h2>
              <p className="text-sm text-ink-soft mb-5">Send a repayment reminder email to pending debtors.</p>
              
              <label className="block text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-1.5">Recipient</label>
              <select 
                value={reminderTarget} 
                onChange={e => setReminderTarget(e.target.value)}
                className="w-full bg-paper-sunken border border-border-strong rounded-lg px-3 py-2.5 text-sm text-ink mb-5 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-200"
              >
                <option value="ALL">All Active Debtors</option>
                {distinctDebtors.map(email => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>

              <div className="flex justify-end gap-2">
                <button onClick={() => setIsReminderModalOpen(false)} className="px-4 py-2 text-sm text-ink-soft hover:text-ink font-semibold rounded-lg hover:bg-paper-sunken transition-all duration-150">
                  Cancel
                </button>
                <button 
                  onClick={handleSendReminder}
                  disabled={isSendingReminder || distinctDebtors.length === 0}
                  className="accent-gradient disabled:opacity-50 text-white px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 btn-press hover:shadow-glow"
                >
                  {isSendingReminder ? 'Sending...' : <><Mail className="w-3.5 h-3.5" /> Send</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddLendBorrowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Tab Switcher */}
      <div className="flex mb-6 gap-1 bg-paper-sunken p-1 rounded-xl w-fit border border-border-default">
         <button 
           onClick={() => setActiveTab('lent')}
           className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
             activeTab === 'lent' 
               ? 'bg-paper-raised text-accent shadow-card' 
               : 'text-ink-soft hover:text-ink'
           }`}
         >
           <span className="flex items-center gap-1.5">
             <ArrowUpRight className="w-3.5 h-3.5" />
             Lent ({lentRecords.length})
           </span>
         </button>
         <button 
           onClick={() => setActiveTab('borrowed')}
           className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
             activeTab === 'borrowed' 
               ? 'bg-paper-raised text-accent shadow-card' 
               : 'text-ink-soft hover:text-ink'
           }`}
         >
           <span className="flex items-center gap-1.5">
             <ArrowDownLeft className="w-3.5 h-3.5" />
             Borrowed ({borrowedRecords.length})
           </span>
         </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-ink-soft flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          Loading records...
        </div>
      ) : activeRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-xl shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
            {activeTab === 'lent' ? <ArrowUpRight className="w-7 h-7 text-accent" /> : <ArrowDownLeft className="w-7 h-7 text-accent" />}
          </div>
          <h2 className="font-display text-lg font-bold text-ink">No {activeTab} records</h2>
          <p className="text-sm text-ink-soft mt-1">Track every rupee lent or borrowed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeRecords.map((record, idx) => (
            <div 
              key={record.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(idx, 5) * 60}ms` }}
            >
              <LendBorrowCard record={record} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
