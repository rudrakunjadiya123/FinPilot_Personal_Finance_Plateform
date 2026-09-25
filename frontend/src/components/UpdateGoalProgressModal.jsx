import React, { useState } from 'react';
import Modal from './primitives/Modal';
import { useGoals } from '../hooks/useGoals';
import { formatCurrency } from '../utils/formatters';

export default function UpdateGoalProgressModal({ isOpen, onClose, goal }) {
  const { logProgress, isLogging } = useGoals();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceType, setSourceType] = useState('Salary');
  const [description, setDescription] = useState('');

  if (!goal) return null;

  const currentSaved = Number(goal.currentSaved || 0);
  const target = Number(goal.targetAmount || 1);
  const addVal = Number(amount || 0);
  const newSaved = currentSaved + addVal;

  const currentPct = Math.min(100, Math.round((currentSaved / target) * 100));
  const newPct = Math.min(100, Math.round((newSaved / target) * 100));

  const presets = [2000, 5000, 10000, 25000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!addVal || addVal <= 0) return;

    try {
      const noteStr = `${sourceType}${description ? ': ' + description.trim() : ''}`;
      await logProgress({ 
        id: goal.id, 
        amount: addVal, 
        date: date ? new Date(date).toISOString() : undefined,
        note: noteStr
      });
      setAmount('');
      setDescription('');
      onClose(); 
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Contribution: ${goal.name}`}>
      <div className="space-y-5 font-body">
        
        {/* Progress Impact Preview (Section 16) */}
        <div className="bg-paper-sunken border border-border-default rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-ink-soft">Contribution Impact</span>
            <span className="text-accent font-mono">
              {currentPct}% → <span className="font-bold text-positive">{newPct}%</span>
            </span>
          </div>

          <div className="w-full h-2 bg-paper rounded-full overflow-hidden">
            <div 
              className="h-full bg-positive rounded-full transition-all duration-300"
              style={{ width: `${newPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-ink-faint font-mono">
            <span>Current: {formatCurrency(currentSaved)}</span>
            <span>Target: {formatCurrency(target)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              Contribution Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
                className="w-full font-mono rounded-xl border border-border-default bg-paper-sunken pl-8 pr-4 py-2.5 text-sm font-semibold text-ink focus:border-accent focus:bg-paper-raised outline-none transition-all"
                placeholder="10,000"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p.toString())}
                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono border border-border-default bg-paper-sunken hover:bg-paper-raised text-ink-soft hover:text-ink transition-colors"
                >
                  +₹{p >= 1000 ? `${p / 1000}K` : p}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Source Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border-default bg-paper-sunken px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Funding Source</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full rounded-xl border border-border-default bg-paper-sunken px-3 py-2 text-xs text-ink focus:border-accent outline-none"
              >
                <option value="Salary">Monthly Salary</option>
                <option value="Bonus">Bonus / Incentive</option>
                <option value="Investment">Investment Return</option>
                <option value="Extra">Extra Savings</option>
                <option value="Gift/Transfer">Transfer</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">Note (Optional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-border-default bg-paper-sunken px-3.5 py-2 text-xs text-ink focus:border-accent outline-none"
              placeholder="e.g. End of quarter savings deposit"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink-soft hover:bg-paper-sunken rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLogging || !amount || Number(amount) <= 0}
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLogging ? 'Updating...' : 'Confirm Contribution'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
