import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIncome } from '../hooks/useIncome';
import AddIncomeModal from '../components/AddIncomeModal';
import KPICard from '../components/KPICard';
import DataTable from '../components/DataTable';
import { Plus, Wallet, TrendingUp } from 'lucide-react';

export default function IncomePage() {
  const { incomeEntries, isLoading } = useIncome();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  let currentMonthTotal = 0;
  let allTimeTotal = 0;
  const currentMonthIdx = new Date().getMonth();
  const currentYearIdx = new Date().getFullYear();

  const entriesArray = Array.isArray(incomeEntries) ? incomeEntries : incomeEntries?.data || [];

  entriesArray.forEach(entry => {
     const amt = Number(entry.amount);
     const dDate = new Date(entry.month);
     allTimeTotal += amt;
     if (dDate.getMonth() === currentMonthIdx && dDate.getFullYear() === currentYearIdx) {
        currentMonthTotal += amt;
     }
  });

  const columns = [
    { label: "Month", render: (item) => new Date(item.month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) },
    { label: "Source", key: "source" },
    { label: "Amount", align: "right", isMonospace: true, render: (item) => `₹${Number(item.amount).toLocaleString("en-IN")}` }
  ];

  return (
    <div className="flex flex-col min-h-full pb-12">
      {portalTarget && createPortal(
        <button 
           onClick={() => setIsModalOpen(true)}
           className="accent-gradient hover:shadow-glow text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center transition-all duration-200 btn-press"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Income
        </button>,
        portalTarget
      )}

      <AddIncomeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <KPICard 
          label="Current Month"
          value={isLoading ? "..." : currentMonthTotal}
          icon={Wallet}
          trend={{ direction: currentMonthTotal > 0 ? 'up' : 'down', label: currentMonthTotal > 0 ? 'Active' : 'No deposits' }}
        />
        <KPICard 
          label="All Time Total"
          value={isLoading ? "..." : allTimeTotal}
          icon={TrendingUp}
          trend={{ direction: 'up', label: 'Cumulative' }}
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-ink-soft flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          Loading income data...
        </div>
      ) : entriesArray.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-xl mt-4 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
            <Wallet className="w-7 h-7 text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold text-ink">No income recorded</h2>
          <p className="text-sm text-ink-soft mt-1 mb-4">Add your salary and other income sources to track cash flow.</p>
        </div>
      ) : (
        <div className="bg-paper-raised border border-border-default rounded-xl overflow-hidden shadow-card">
          <div className="p-5 border-b border-border-default">
             <h3 className="font-display text-base font-bold text-ink">Income Ledger</h3>
             <span className="text-xs text-ink-faint mt-0.5 block">Tracking {entriesArray.length} recorded entries</span>
          </div>
          <div className="p-5 overflow-x-auto w-full max-h-[500px]">
             <DataTable columns={columns} data={[...entriesArray].sort((a,b) => new Date(b.month) - new Date(a.month))} />
          </div>
        </div>
      )}
    </div>
  );
}
