import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGoals } from '../hooks/useGoals';
import AddGoalModal from '../components/AddGoalModal';
import GoalCard from '../components/GoalCard';
import { Plus, Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function GoalsPage() {
  const { goals, globalPaceState, isLoading } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('topbar-actions'));
  }, []);

  const onTrack = goals.filter(g => g.computedPace?.statusFlag === 'ON_TRACK').length;
  const atRisk = goals.filter(g => g.computedPace?.statusFlag === 'AT_RISK').length;
  const completed = goals.filter(g => g.computedPace?.statusFlag === 'COMPLETED').length;

  return (
    <div className="flex flex-col min-h-full pb-12">
      {portalTarget && createPortal(
        <button 
           onClick={() => setIsModalOpen(true)}
           className="accent-gradient hover:shadow-glow text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center transition-all duration-200 btn-press"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Define Goal
        </button>,
        portalTarget
      )}

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Global Pace Alert */}
      {globalPaceState && (
        <div className="bg-accent-soft border border-accent/20 rounded-xl p-5 mb-5 flex items-start gap-4 animate-slide-up">
           <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-accent" />
           </div>
           <div>
              <h3 className="font-display text-base font-bold text-ink mb-0.5">Portfolio Diagnostics</h3>
              <p className="text-sm text-ink-soft">{globalPaceState}</p>
           </div>
        </div>
      )}

      {/* KPI Banner */}
      {!isLoading && goals.length > 0 && (
        <div className="bg-paper-raised border border-border-default rounded-xl grid grid-cols-2 md:grid-cols-4 p-1 mb-6 shadow-card gap-1">
          {[
            { label: 'Total Goals', value: goals.length, icon: Target },
            { label: 'On Track', value: onTrack, icon: TrendingUp },
            { label: 'At Risk', value: atRisk, icon: AlertTriangle },
            { label: 'Completed', value: completed, icon: CheckCircle2 },
          ].map((stat, i) => (
            <div key={i} className="p-3 rounded-lg hover:bg-paper-sunken transition-colors duration-150 text-center">
              <stat.icon className="w-4 h-4 text-accent mx-auto mb-1.5" />
              <span className="block text-[10px] text-ink-faint uppercase tracking-wider font-semibold">{stat.label}</span>
              <span className="font-mono text-xl text-ink font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-ink-soft mt-4 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          Evaluating goal progress...
        </div>
      ) : goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-paper-raised border border-border-default border-dashed rounded-xl mt-4 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-accent" />
          </div>
          <h2 className="font-display text-lg font-bold text-ink">No goals defined yet</h2>
          <p className="text-sm text-ink-soft mt-1 max-w-sm">Set savings targets or debt payoff accelerations to track your progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal, idx) => (
            <div 
              key={goal.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(idx, 5) * 60}ms` }}
            >
              <GoalCard goal={goal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
