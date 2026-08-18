import React from 'react';
import Modal from './primitives/Modal';

export default function GoalHistoryModal({ isOpen, onClose, goal }) {
  if (!goal) return null;

  const logs = goal.progressLogs || [];
  const isSavings = goal.goalType === 'savings';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`History: ${goal.name}`}>
      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-sm text-ink-soft">
            <p>No historical deposits logged yet.</p>
          </div>
        ) : (
          <div className="border border-border-default rounded-xl overflow-hidden bg-paper">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-paper-sunken border-b border-border-default">
                <tr>
                  <th className="px-4 py-3 font-medium text-ink-soft">Date</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Amount</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper-sunken/50 transition-colors">
                    <td className="px-4 py-3 text-ink">
                      {new Date(log.date).toLocaleDateString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric' 
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-accent">
                      ₹{Number(log.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-ink-soft truncate max-w-[200px]" title={log.note || '-'}>
                      {log.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="pt-2 border-t border-border-default flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-sunken transition-colors">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
