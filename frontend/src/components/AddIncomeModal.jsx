import React, { useState } from 'react';
import Modal from './primitives/Modal';
import { useIncome } from '../hooks/useIncome';
import DatePickerInput from './primitives/DatePickerInput';

export default function AddIncomeModal({ isOpen, onClose }) {
  const { addIncome, isAdding } = useIncome();
  
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    month: '',
  });

  const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addIncome({
        ...formData,
        amount: Number(formData.amount),
        // Force month explicitly parsing isolated bounds natively securely
        month: new Date(formData.month).toISOString()
      });
      onClose(); // Automatically exit natively closing bounds map without reloading!
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income Source">
      <form onSubmit={handleSubmit} className="space-y-4 font-body">

         <div>
           <label className="block text-sm text-ink mb-1">Source Designator</label>
           <input 
              type="text" 
              name="source" value={formData.source} onChange={handleChange} required placeholder="e.g. Acme Corp Salary, Freelance Shopify"
              className="w-full rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm outline-none focus:border-accent transition-colors" 
           />
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink mb-1">Total Yield (₹)</label>
              <input 
                type="number" 
                name="amount" value={formData.amount} onChange={handleChange} min="1" required placeholder="0"
                className="w-full font-mono rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm outline-none focus:border-accent transition-colors" 
              />
            </div>
            <div>
               <label className="block text-sm text-ink mb-1">Month</label>
               <DatePickerInput 
                 selected={formData.month ? new Date(formData.month + "-01T00:00:00") : null}
                 onChange={(date) => {
                   if (date) {
                     const y = date.getFullYear();
                     const m = String(date.getMonth() + 1).padStart(2, '0');
                     setFormData(prev => ({...prev, month: `${y}-${m}`}));
                   } else {
                     setFormData(prev => ({...prev, month: ''}));
                   }
                 }}
                 placeholder="Select Month"
                 dateFormat="yyyy-MM"
                 showMonthYearPicker={true}
               />
            </div>
         </div>

         <div className="pt-4 border-t border-border-default flex justify-end gap-3 mt-6">
           <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-sunken transition-colors">Cancel</button>
           <button type="submit" disabled={isAdding} className="accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] ease-out-soft flex items-center text-sm disabled:opacity-50">
             {isAdding ? 'Registering...' : 'Add Income'}
           </button>
         </div>
      </form>
    </Modal>
  );
}
