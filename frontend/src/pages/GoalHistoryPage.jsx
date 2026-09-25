import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '../hooks/useGoals';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusPill from '../components/primitives/StatusPill';
import UpdateGoalProgressModal from '../components/UpdateGoalProgressModal';
import { 
  ArrowLeft, Target, Trash2, PlusCircle, History 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export default function GoalHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { goals, isLoading, deleteGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goal = (goals || []).find(g => g.id === id);
  const target = Number(goal?.targetAmount || 0);
  const logs = goal?.progressLogs || [];

  // Chart data formatting: deduplicate or uniquely label points (Section 17)
  const chartData = useMemo(() => {
    if (!logs.length) return [];
    const chronoLogs = [...logs].reverse();
    let cumulative = 0;
    
    return chronoLogs.map((log, idx) => {
      cumulative += Number(log.amount || 0);
      const d = new Date(log.date);
      const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return {
        label: `${dateLabel}${chronoLogs.filter(l => new Date(l.date).toDateString() === d.toDateString()).length > 1 ? ` (#${idx + 1})` : ''}`,
        dateStr: formatDate(log.date),
        deposit: Number(log.amount),
        cumulative: cumulative,
        target: target
      };
    });
  }, [logs, target]);

  if (isLoading) {
    return (
      <div className="text-ink-soft p-12 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span>Loading goal history...</span>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-paper-raised border border-border-default border-dashed rounded-2xl shadow-card space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
          <Target className="w-6 h-6" />
        </div>
        <h2 className="font-display text-base font-bold text-ink">Goal Not Found</h2>
        <p className="text-xs text-ink-faint">This financial goal may have been archived or deleted.</p>
        <button 
          onClick={() => navigate('/app/goals')} 
          className="text-accent hover:text-accent-hover font-semibold text-xs transition-colors"
        >
          Return to Goals
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${goal.name}"? This cannot be undone.`)) {
      deleteGoal(id).then(() => navigate('/app/goals'));
    }
  };

  const isSavings = goal.goalType === 'savings';
  const currentSaved = Number(goal.currentSaved || 0);

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-20 font-body">
      
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/goals')}
            className="p-2 rounded-xl border border-border-default hover:bg-paper-sunken text-ink-soft hover:text-accent transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink tracking-tight">
                {goal.name} History
              </h1>
              <StatusPill status={currentSaved >= target ? 'completed' : 'active'} size="xs" />
            </div>
            <p className="text-xs text-ink-soft mt-0.5">Contribution records & cumulative trajectory</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSavings && currentSaved < target && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-accent hover:bg-accent-hover text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Contribution
            </button>
          )}
          <button
            onClick={handleDelete}
            className="border border-negative/20 text-negative hover:bg-negative-soft text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <span className="text-xs font-medium text-ink-soft block">Current Accumulated</span>
          <div className="text-2xl font-mono font-bold text-ink mt-1">
            {formatCurrency(currentSaved)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Total saved so far</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <span className="text-xs font-medium text-ink-soft block">Target Goal</span>
          <div className="text-2xl font-mono font-bold text-ink mt-1">
            {formatCurrency(target)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Final savings objective</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <span className="text-xs font-medium text-ink-soft block">Remaining Amount</span>
          <div className="text-2xl font-mono font-bold text-accent mt-1">
            {formatCurrency(Math.max(0, target - currentSaved))}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Required to complete</span>
        </div>

        <div className="bg-paper-raised border border-border-default rounded-2xl p-4 shadow-card">
          <span className="text-xs font-medium text-ink-soft block">Total Contributions</span>
          <div className="text-2xl font-mono font-bold text-ink mt-1">
            {logs.length}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Logged deposits</span>
        </div>
      </div>

      {/* ── Chart Section (Section 17: Fixed Margins & Labels) ── */}
      {logs.length > 0 && (
        <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <span className="text-xs font-semibold text-ink">Cumulative Trajectory vs Target</span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-accent">
                <span className="w-2.5 h-0.5 bg-accent" /> Saved Progress
              </span>
              <span className="flex items-center gap-1.5 text-ink-faint">
                <span className="w-2.5 h-0.5 bg-border-strong border-t border-dashed" /> Target Line
              </span>
            </div>
          </div>

          <div className="h-[300px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {/* Margin left adjusted to 55 to prevent Y-axis clipping */}
              <LineChart data={chartData} margin={{ top: 10, right: 25, bottom: 10, left: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-val, #E5E7EB)" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'var(--color-ink-soft-val, #6B7280)' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'var(--color-ink-faint-val, #9CA3AF)' }} 
                  tickFormatter={(val) => `₹${Math.round(val / 1000)}K`} 
                  dx={-10} 
                />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-line-val, #E5E7EB)', 
                    boxShadow: 'var(--shadow-elevated)', 
                    background: 'var(--color-paper-raised-val, #FFFFFF)', 
                    fontSize: '12px' 
                  }}
                  formatter={(value, name) => [formatCurrency(value), name === 'cumulative' ? 'Cumulative Saved' : 'Target']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.dateStr || ''}
                />
                <ReferenceLine y={target} stroke="var(--color-ink-faint-val, #9CA3AF)" strokeDasharray="4 4" />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="var(--color-accent-val, #F7931A)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--color-accent-val, #F7931A)', strokeWidth: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Contribution Log Table ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-sm text-ink">Deposit History Ledger</h3>
          </div>
          <span className="text-xs text-ink-soft">
            {logs.length} Total Deposits
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-xs text-ink-faint">
            <p>No contributions logged yet for this goal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-sunken border-b border-border-default uppercase tracking-wider font-semibold text-ink-faint sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3">Contribution Date</th>
                  <th className="px-6 py-3">Source & Notes</th>
                  <th className="px-6 py-3 text-right">Amount Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default bg-paper-raised text-ink">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-sunken/60 transition-colors">
                    <td className="px-6 py-3.5 text-xs font-mono font-medium">
                      {formatDate(log.date)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-ink-soft">
                      {log.note || <span className="italic text-ink-faint">Regular contribution</span>}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-positive text-sm">
                      +{formatCurrency(log.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isSavings && (
        <UpdateGoalProgressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} goal={goal} />
      )}
    </div>
  );
}
