import React, { useState, useMemo } from 'react';
import StatusPill from './primitives/StatusPill';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Calendar, Download } from 'lucide-react';

export default function EMIScheduleTable({ schedule = [] }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'pending', 'next12'

  const sortedSchedule = useMemo(() => {
    return [...(schedule || [])].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [schedule]);

  // Find next unpaid installment
  const nextUnpaidId = useMemo(() => {
    const next = sortedSchedule.find(s => !s.isPaid);
    return next ? next.id : null;
  }, [sortedSchedule]);

  // Filter items
  const filteredSchedule = useMemo(() => {
    if (filterMode === 'pending') {
      return sortedSchedule.filter(s => !s.isPaid);
    }
    if (filterMode === 'next12') {
      const unpaidIndex = sortedSchedule.findIndex(s => !s.isPaid);
      const startIndex = unpaidIndex >= 0 ? unpaidIndex : 0;
      return sortedSchedule.slice(startIndex, startIndex + 12);
    }
    return sortedSchedule;
  }, [sortedSchedule, filterMode]);

  const handleExportCSV = () => {
    if (!sortedSchedule.length) return;
    const headers = ['#', 'Due Date', 'Total EMI (INR)', 'Principal (INR)', 'Interest (INR)', 'Balance (INR)', 'Status'];
    const rows = sortedSchedule.map((item, idx) => {
      const emi = Number(item.principalComponent || 0) + Number(item.interestComponent || 0);
      return [
        idx + 1,
        new Date(item.dueDate).toISOString().split('T')[0],
        emi,
        Number(item.principalComponent || 0),
        Number(item.interestComponent || 0),
        Number(item.balanceAfter || 0),
        item.isPaid ? 'Paid' : 'Pending'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'finpilot_amortization_schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-default">
        <div>
          <h3 className="text-lg font-display font-bold text-ink tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Amortization Schedule
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Full principal and interest payment breakdown over remaining loan tenure
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex bg-paper-sunken p-1 rounded-xl border border-border-default text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'all' ? 'bg-paper-raised text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              All ({sortedSchedule.length})
            </button>
            <button
              onClick={() => setFilterMode('next12')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'next12' ? 'bg-paper-raised text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Next 12
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'pending' ? 'bg-paper-raised text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="Export CSV"
            className="p-2 rounded-xl border border-border-default hover:bg-paper-sunken text-ink-soft hover:text-ink transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-border-default">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-paper-sunken text-ink-faint uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-border-default">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Total EMI</th>
              <th className="py-3 px-4">Principal</th>
              <th className="py-3 px-4">Interest</th>
              <th className="py-3 px-4">Ending Balance</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default bg-paper-raised text-ink">
            {filteredSchedule.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-ink-faint">
                  No installments match the selected filter.
                </td>
              </tr>
            ) : (
              filteredSchedule.map((item, idx) => {
                const isNext = item.id === nextUnpaidId;
                const emi = Number(item.principalComponent || 0) + Number(item.interestComponent || 0);

                return (
                  <tr 
                    key={item.id || idx}
                    className={`transition-colors hover:bg-paper-sunken/60 ${
                      isNext ? 'bg-accent-soft/30 border-l-4 border-l-accent' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-mono text-ink-faint">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{formatDate(item.dueDate)}</span>
                        {isNext && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent text-white uppercase">
                            Next
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink">
                      {formatCurrency(emi)}
                    </td>
                    <td className="py-3 px-4 font-mono text-ink">
                      {formatCurrency(item.principalComponent)}
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-soft">
                      {formatCurrency(item.interestComponent)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-ink">
                      {formatCurrency(item.balanceAfter)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusPill 
                        status={item.isPaid ? 'paid' : isNext ? 'due_soon' : 'pending'} 
                        label={item.isPaid ? 'Paid' : isNext ? 'Due Soon' : 'Pending'}
                        size="xs" 
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
