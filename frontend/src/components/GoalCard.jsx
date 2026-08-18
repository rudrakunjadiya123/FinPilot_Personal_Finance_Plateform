import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './primitives/ProgressBar';
import UpdateGoalProgressModal from './UpdateGoalProgressModal';
import { Target, RotateCcw, Trash2, ArrowRight } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';

export default function GoalCard({ goal }) {
  const navigate = useNavigate();
  const { deleteGoal } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isSavings = goal.goalType === 'savings';
  
  const pace = goal.computedPace || {};
  const statusFlag = pace.statusFlag || "ANALYZING";

  let totalMax = 0;
  let currentVal = 0;
  let labelLeft = "";
  let labelRight = "";
  
  if (isSavings) {
     totalMax = Number(goal.targetAmount);
     currentVal = Number(goal.currentSaved);
     labelLeft = `₹${currentVal.toLocaleString("en-IN")}`;
     labelRight = `of ₹${totalMax.toLocaleString("en-IN")}`;
  } else if (goal.loan) {
     totalMax = Number(goal.loan.principalAmount);
     currentVal = totalMax - Number(goal.loan.outstandingBalance);
     labelLeft = `₹${currentVal.toLocaleString("en-IN")} cleared`;
     labelRight = `of ₹${totalMax.toLocaleString("en-IN")}`;
  }
  
  const percentage = totalMax > 0 ? Math.round((currentVal / totalMax) * 100) : 0;

  const statusMap = {
    'ON_TRACK': { label: 'On Track', dotClass: 'bg-green-500', bgClass: 'bg-green-50 dark:bg-green-950/40 text-green-600', ringColor: '#22c55e' },
    'AT_RISK': { label: 'At Risk', dotClass: 'bg-amber-500', bgClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600', ringColor: '#f59e0b' },
    'OFF_TRACK': { label: 'Off Track', dotClass: 'bg-red-500', bgClass: 'bg-red-50 dark:bg-red-950/40 text-red-500', ringColor: '#ef4444' },
    'COMPLETED': { label: 'Completed', dotClass: 'bg-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600', ringColor: '#3b82f6' },
    'ANALYZING': { label: 'Analyzing', dotClass: 'bg-ink-faint', bgClass: 'bg-paper-sunken text-ink-soft', ringColor: 'var(--color-accent)' },
  };
  const activeStatus = statusMap[statusFlag] || statusMap['ANALYZING'];

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this goal? This cannot be undone.")) {
      deleteGoal(goal.id);
    }
  };

  // SVG circular progress
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <div 
        onClick={() => navigate(`/goals/${goal.id}`)}
        className="bg-paper-raised border border-border-default rounded-xl p-5 flex flex-col justify-between group h-full shadow-card relative cursor-pointer card-hover overflow-hidden"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${activeStatus.bgClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeStatus.dotClass}`} />
            {activeStatus.label}
          </span>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-semibold text-ink-faint bg-paper-sunken px-2 py-0.5 rounded-full tracking-wider">
               {isSavings ? 'Savings' : 'Debt Payoff'}
            </span>
            <button 
               onClick={handleDelete}
               className="opacity-0 group-hover:opacity-100 p-1 text-ink-faint hover:text-negative hover:bg-negative-soft rounded-lg transition-all duration-150"
               title="Delete Goal"
            >
               <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Goal info with circular progress */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-border-default)" strokeWidth="4" />
              <circle 
                cx="32" cy="32" r="28" fill="none" 
                stroke={activeStatus.ringColor} strokeWidth="4" 
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-ink">{percentage}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-bold text-ink tracking-tight flex items-center gap-1.5 truncate">
               {isSavings ? <Target className="w-4 h-4 text-accent shrink-0" /> : <RotateCcw className="w-4 h-4 text-positive shrink-0" />}
               {goal.name}
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
               {isSavings 
                  ? `Need ₹${Number(pace.requiredMonthlyContribution || 0).toLocaleString("en-IN")}/mo` 
                  : `Extra ₹${Number(pace.extraMonthlyNeeded || 0).toLocaleString("en-IN")}/mo over EMI`
               }
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-auto">
          <ProgressBar 
            current={currentVal} 
            max={totalMax} 
            labelLeft={labelLeft}
            labelRight={labelRight} 
            colorVariant={isSavings ? 'primary' : 'positive'} 
          />

          {isSavings && statusFlag !== 'COMPLETED' && (
            <button 
               onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
               className="w-full mt-3 bg-accent-soft hover:bg-accent text-accent hover:text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 btn-press"
            >
               Log Deposit <ArrowRight className="w-3 h-3" />
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
