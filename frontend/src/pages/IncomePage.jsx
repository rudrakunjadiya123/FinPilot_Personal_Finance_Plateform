import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useIncome } from '../hooks/useIncome';
import AddIncomeModal from '../components/AddIncomeModal';
import StatusPill from '../components/primitives/StatusPill';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, Wallet, TrendingUp, Calendar, PiggyBank, 
  Search, PieChart 
} from 'lucide-react';

export default function IncomePage() {
  const { incomeEntries, isLoading } = useIncome();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYearIdx = now.getFullYear();
  const currentPeriodName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const entriesArray = useMemo(() => {
    const arr = Array.isArray(incomeEntries) ? incomeEntries : incomeEntries?.data || [];
    return [...arr].sort((a, b) => new Date(b.month) - new Date(a.month));
  }, [incomeEntries]);

  // Calculations for Section 13
  const metrics = useMemo(() => {
    let thisMonth = 0;
    let lastMonth = 0;
    let ytd = 0;
    const monthsMap = new Map();
    const sourceBreakdown = {};

    const lastMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
    const lastMonthYear = currentMonthIdx === 0 ? currentYearIdx - 1 : currentYearIdx;

    entriesArray.forEach(entry => {
      const amt = Number(entry.amount || 0);
      const d = new Date(entry.month);
      const mIdx = d.getMonth();
      const yIdx = d.getFullYear();
      const monthKey = `${yIdx}-${mIdx}`;

      // This Month
      if (mIdx === currentMonthIdx && yIdx === currentYearIdx) {
        thisMonth += amt;
      }
      // Last Month
      if (mIdx === lastMonthIdx && yIdx === lastMonthYear) {
        lastMonth += amt;
      }
      // YTD
      if (yIdx === currentYearIdx) {
        ytd += amt;
      }

      // Monthly aggregation for average
      monthsMap.set(monthKey, (monthsMap.get(monthKey) || 0) + amt);

      // Source breakdown
      const src = entry.source || 'Other';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + amt;
    });

    const activeMonthsCount = Math.max(1, monthsMap.size);
    const totalAllTime = Array.from(monthsMap.values()).reduce((a, b) => a + b, 0);
    const avgMonthly = Math.round(totalAllTime / activeMonthsCount);

    return {
      thisMonth,
      lastMonth,
      ytd,
      avgMonthly,
      sourceBreakdown
    };
  }, [entriesArray, currentMonthIdx, currentYearIdx]);

  // Filtered ledger entries
  const filteredEntries = useMemo(() => {
    return entriesArray.filter(entry => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const src = (entry.source || '').toLowerCase();
        if (!src.includes(q)) return false;
      }
      if (sourceFilter !== 'all') {
        if ((entry.source || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [entriesArray, searchQuery, sourceFilter]);

  const distinctSources = useMemo(() => {
    return Array.from(new Set(entriesArray.map(e => e.source).filter(Boolean)));
  }, [entriesArray]);

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-20 font-body">
      {/* Portalled Topbar Action */}
      {portalTarget && createPortal(
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Income
        </button>,
        portalTarget
      )}

      <AddIncomeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ── Summary Metrics Strip (Section 13) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">This Month</span>
            <div className="w-7 h-7 rounded-lg bg-positive-soft flex items-center justify-center text-positive">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">
            {formatCurrency(metrics.thisMonth)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">{currentPeriodName}</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Last Month</span>
            <div className="w-7 h-7 rounded-lg bg-info-soft flex items-center justify-center text-info">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">
            {formatCurrency(metrics.lastMonth)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Previous cycle</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Year to Date (YTD)</span>
            <div className="w-7 h-7 rounded-lg bg-positive-soft flex items-center justify-center text-positive">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">
            {formatCurrency(metrics.ytd)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">{currentYearIdx} Total</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-soft">Avg Monthly Income</span>
            <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center text-accent-text">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono font-bold text-ink">
            {formatCurrency(metrics.avgMonthly)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Calculated baseline</span>
        </div>
      </div>

      {/* ── Income Source Breakdown Bar ── */}
      {Object.keys(metrics.sourceBreakdown).length > 0 && (
        <div className="bg-paper-raised border border-border-default rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent" />
              <h3 className="font-display font-bold text-sm text-ink">Income Source Distribution</h3>
            </div>
            <span className="text-[11px] text-ink-soft">All recorded entries</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(metrics.sourceBreakdown).map(([source, amt]) => (
              <div key={source} className="bg-paper-sunken p-3 rounded-xl border border-border-default">
                <span className="text-xs font-semibold text-ink-soft capitalize block">{source}</span>
                <span className="text-sm font-mono font-bold text-ink block mt-0.5">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by source (e.g. Salary)..."
            className="w-full bg-paper-sunken border border-border-default rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-faint outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-paper-sunken border border-border-default rounded-xl px-3 py-1.5 text-xs text-ink outline-none focus:border-accent w-full sm:w-auto"
          >
            <option value="all">All Sources</option>
            {distinctSources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="sm:hidden py-1.5 px-3 rounded-xl text-xs font-semibold bg-accent text-white"
          >
            + Add
          </button>
        </div>
      </div>

      {/* ── Income Ledger Table ── */}
      {isLoading ? (
        <div className="text-sm text-ink-soft p-12 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading verified income ledger...</span>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-2xl shadow-card space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="font-display text-base font-bold text-ink">No income entries found</h2>
          <p className="text-xs text-ink-soft max-w-sm">
            {searchQuery || sourceFilter !== 'all' 
              ? 'No records match your filter criteria.' 
              : 'Add your salary and recurring revenue sources to calculate accurate cash flow.'}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
          >
            + Add income entry
          </button>
        </div>
      ) : (
        <div className="bg-paper-raised border border-border-default rounded-2xl overflow-hidden shadow-card">
          <div className="p-4 border-b border-border-default flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ink">Recorded Income History</h3>
            <span className="text-xs text-ink-soft">
              Showing {filteredEntries.length} of {entriesArray.length} entries
            </span>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-paper-sunken text-ink-faint font-semibold uppercase tracking-wider border-b border-border-default sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Accounting Month</th>
                  <th className="px-5 py-3">Income Source</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-paper-raised text-ink">
                {filteredEntries.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-paper-sunken/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink">
                      {formatDate(item.month, { format: 'fullMonth' })}
                    </td>
                    <td className="px-5 py-3 capitalize font-semibold text-ink-soft">
                      {item.source}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status="verified" size="xs" />
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-positive text-sm">
                      +{formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
