import React, { useState } from 'react';
import Modal from './primitives/Modal';
import { useGoals } from '../hooks/useGoals';

export default function UpdateGoalProgressModal({ isOpen, onClose, goal }) {
  const { logProgress, isLogging } = useGoals();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  if (!goal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) return;

    try {
      await logProgress({ id: goal.id, amount: val, note: description.trim() || undefined });
      setAmount('');
      setDescription('');
      onClose(); 
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Savings: ${goal.name}`}>
      <div className="space-y-6">
         <form onSubmit={handleSubmit} className="space-y-4 font-body">
             <div>
               <label className="block text-sm text-ink mb-1">Amount Saved This Cycle (₹)</label>
               <input 
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 min="1"
                 required
                 className="w-full font-mono rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                 placeholder="Example: 5000"
               />
             </div>
             
             <div>
               <label className="block text-sm text-ink mb-1">Description (Optional)</label>
               <input 
                 type="text" 
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 className="w-full rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                 placeholder="e.g. November Bonus Allocation"
               />
             </div>
             
             <button 
               type="submit" 
               disabled={isLogging || !amount}
               className="w-full mt-2 accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] ease-out-soft flex items-center justify-center text-sm disabled:opacity-50"
             >
               {isLogging ? 'Logging...' : 'Log Contribution'}
             </button>
           </form>
      </div>
    </Modal>
  );
}
