import React, { useState } from 'react';
import Modal from './primitives/Modal';
import { useLendBorrow } from '../hooks/useLendBorrow';

export default function ChangeInterestModal({ isOpen, onClose, record }) {
  const { changeInterestRate, isChangingInterest } = useLendBorrow();
  const [newRate, setNewRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [interestType, setInterestType] = useState(record?.interestType || 'simple');
  const [compoundingFrequency, setCompoundingFrequency] = useState(record?.compoundingFrequency || 1);

  if (!record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newRate === '' || newRate < 0) return;

    try {
      await changeInterestRate({
        id: record.id,
        newRate: Number(newRate),
        startDate: startDate,
        interestType: interestType,
        compoundingFrequency: interestType === 'compound' ? Number(compoundingFrequency) : null
      });
      setNewRate('');
      onClose();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Interest Rate">
      <div className="space-y-4 font-body">
        <p className="text-sm text-ink-soft mb-2">
          Apply a new interest rate and type starting from a specific date. This applies piecewise mathematics across the transaction history, retaining the previous accrual calculations safely.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm text-ink mb-1">New Interest Rate (%)</label>
                 <input 
                   type="number" step="0.1"
                   value={newRate}
                   onChange={(e) => setNewRate(e.target.value)}
                   min="0"
                   required
                   className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                   placeholder="Example: 8.5"
                 />
              </div>
              
              <div>
                 <label className="block text-sm text-ink mb-1">Effective Start Date</label>
                 <input 
                   type="date" 
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)}
                   required
                   className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 bg-paper-sunken p-3 rounded-xl border border-border-default">
              <div>
                 <label className="block text-sm text-ink mb-1">Interest Type</label>
                 <select 
                   value={interestType} 
                   onChange={(e) => setInterestType(e.target.value)} 
                   className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
                 >
                    <option value="simple">Simple</option>
                    <option value="compound">Compound</option>
                 </select>
              </div>
              
              {interestType === 'compound' && (
                <div>
                   <label className="block text-sm text-ink mb-1">Compounding Rate</label>
                   <select 
                     value={compoundingFrequency} 
                     onChange={(e) => setCompoundingFrequency(Number(e.target.value))} 
                     className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
                   >
                      <option value={1}>Monthly</option>
                      <option value={3}>Quarterly</option>
                      <option value={6}>Semi-Annually</option>
                      <option value={12}>Yearly</option>
                   </select>
                </div>
              )}
           </div>

           <div className="pt-4 border-t border-border-default flex justify-end gap-3 mt-6">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-sunken transition-colors">Cancel</button>
             <button type="submit" disabled={isChangingInterest} className="accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] flex items-center text-sm disabled:opacity-50">
               {isChangingInterest ? 'Applying...' : 'Apply New Rate'}
             </button>
           </div>
        </form>
      </div>
    </Modal>
  );
}
