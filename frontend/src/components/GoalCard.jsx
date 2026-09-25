import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusPill from './primitives/StatusPill';
import UpdateGoalProgressModal from './UpdateGoalProgressModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Target, RotateCcw, Trash2, Calendar, PlusCircle } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';

export default function GoalCard({ goal }) {
  const navigate = useNavigate();
  const { deleteGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSavings = goal.goalType === 'savings';
  
  const pace = goal.computedPace || {};
  const statusFlag = pace.statusFlag || (goal.status === 'completed' ? 'COMPLETED' : 'ON_TRACK');

  let totalMax = 0;
  let currentVal = 0;
  
  if (isSavings) {
    totalMax = Number(goal.targetAmount || 0);
    currentVal = Number(goal.currentSaved || 0);
  } else if (goal.loan) {
    totalMax = Number(goal.loan.principalAmount || 0);
    currentVal = Math.max(0, totalMax - Number(goal.loan.outstandingBalance || 0));
  }
  
  const percentage = totalMax > 0 ? Math.min(100, Math.round((currentVal / totalMax) * 100)) : 0;

  // Normalized status pill mapping
  let normalizedStatus = 'on_track';
  if (statusFlag === 'COMPLETED' || percentage >= 100) normalizedStatus = 'completed';
  else if (statusFlag === 'AT_RISK') normalizedStatus = 'at_risk';
  else if (statusFlag === 'OFF_TRACK') normalizedStatus = 'off_track';

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${goal.name}"? This cannot be undone.`)) {
      deleteGoal(goal.id);
    }
  };

  const deadlineStr = goal.targetDate ? formatDate(goal.targetDate, { format: 'monthYear' }) : 'No deadline';
  const monthlyReq = isSavings 
    ? Number(pace.requiredMonthlyContribution || 0) 
    : Number(pace.extraMonthlyNeeded || 0);

  return (
    <>
      <div 
        onClick={() => navigate(`/app/goals/${goal.id}`)}
        className="bg-paper-raised border border-border-default rounded-2xl p-5 flex flex-col justify-between group shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer relative overflow-hidden"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <StatusPill status={normalizedStatus} size="xs" />

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-semibold text-ink-faint bg-paper-sunken px-2.5 py-0.5 rounded-full border border-border-default">
                {isSavings ? 'Savings Target' : 'Debt Freedom'}
              </span>
              <button 
                onClick={handleDelete}
                className="p-1 text-ink-faint hover:text-negative hover:bg-negative-soft rounded-lg transition-colors"
                title="Delete Goal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Goal Title & Target amounts */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-bold text-ink tracking-tight flex items-center gap-1.5 truncate group-hover:text-accent transition-colors">
                {isSavings ? <Target className="w-4 h-4 text-accent shrink-0" /> : <RotateCcw className="w-4 h-4 text-positive shrink-0" />}
                <span className="truncate">{goal.name}</span>
              </h3>
              <div className="text-xs text-ink-soft mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-ink-faint" />
                <span>Target Deadline: <strong className="text-ink font-semibold">{deadlineStr}</strong></span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-mono font-bold text-ink block">
                {formatCurrency(currentVal, { compact: true })} / {formatCurrency(totalMax, { compact: true })}
              </span>
              <span className="text-[10px] font-mono text-ink-faint font-semibold block">{percentage}% complete</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 mb-4">
            <div className="w-full h-2 bg-paper-sunken rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  percentage >= 100 ? 'bg-positive' : normalizedStatus === 'at_risk' ? 'bg-warning' : normalizedStatus === 'off_track' ? 'bg-negative' : 'bg-accent'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink-faint font-mono">
              <span>{formatCurrency(currentVal)} saved</span>
              <span>Target: {formatCurrency(totalMax)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Pace & Action CTA */}
        <div className="pt-3 border-t border-border-default space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink-soft text-[11px]">Monthly Pace Needed:</span>
            <span className="font-mono font-bold text-ink text-xs">
              {monthlyReq > 0 ? `${formatCurrency(monthlyReq)}/mo` : 'On Schedule'}
            </span>
          </div>

          {isSavings && normalizedStatus !== 'completed' && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsModalOpen(true); 
              }}
              className="w-full py-2 px-3 rounded-xl bg-accent-soft hover:bg-accent text-accent hover:text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Contribution</span>
            </button>
          )}
        </div>
      </div>

      {isSavings && (
        <UpdateGoalProgressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} goal={goal} />
      )}
    </>
  );
}
