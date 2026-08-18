import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '../hooks/useGoals';
import { ArrowLeft, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GoalHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { goals, isLoading } = useGoals();
  
  if (isLoading) {
    return (
      <div className="text-ink-soft flex items-center gap-2 p-4">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading goal data...
      </div>
    );
  }

  const goal = goals.find(g => g.id === id);
  
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-paper-raised border border-border-default border-dashed rounded-xl shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
          <Target className="w-7 h-7 text-accent" />
        </div>
        <h2 className="font-display text-lg font-bold text-ink">Goal Not Found</h2>
        <p className="text-sm text-ink-faint mt-1">This goal may have been deleted.</p>
        <button onClick={() => navigate('/goals')} className="mt-4 text-accent hover:text-accent-hover font-semibold text-sm transition-colors">
          Return to Goals
        </button>
      </div>
    );
  }

  const logs = goal.progressLogs || [];
  
  const chartData = useMemo(() => {
    const chronoLogs = [...logs].reverse();
    let cumulative = 0;
    return chronoLogs.map(log => {
      cumulative += Number(log.amount);
      return {
        date: new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        deposit: Number(log.amount),
        cumulative: cumulative
      };
    });
  }, [logs]);

  return (
    <div className="flex flex-col min-h-full pb-12">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/goals')}
          className="mr-3 p-2 rounded-xl hover:bg-paper-sunken text-ink-soft hover:text-accent transition-all duration-150"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            {goal.name} History
          </h1>
          <p className="text-xs text-ink-faint mt-0.5">Progress logs and deposit history</p>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-paper-raised border border-border-default rounded-xl p-6 mb-6 w-full h-[300px] shadow-card">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: '1px solid var(--color-border-default)', boxShadow: 'var(--shadow-elevated)', background: 'var(--color-paper-raised)', fontSize: '12px' }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Saved']}
              />
              <Line type="monotone" dataKey="cumulative" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-paper-raised border border-border-default rounded-xl overflow-hidden shadow-card">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-ink-faint">
            <p>No deposits logged yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-paper-sunken border-b border-border-default">
              <tr>
                <th className="px-6 py-3 font-semibold text-[10px] text-ink-faint uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 font-semibold text-[10px] text-ink-faint uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 font-semibold text-[10px] text-ink-faint uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-accent-soft/30 transition-colors duration-100">
                  <td className="px-6 py-3.5 text-ink text-xs font-mono">
                    {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-accent text-sm">
                    ₹{Number(log.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-3.5 text-ink-soft text-xs truncate max-w-[400px]" title={log.note || 'No description'}>
                    {log.note || <span className="italic text-ink-faint">No description</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
