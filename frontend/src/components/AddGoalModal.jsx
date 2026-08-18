import React, { useState } from 'react';
import Modal from './primitives/Modal';
import DatePickerInput from './primitives/DatePickerInput';
import { useGoals } from '../hooks/useGoals';
import { useLoans } from '../hooks/useLoans';

export default function AddGoalModal({ isOpen, onClose }) {
  const { addGoal, isAdding } = useGoals();
  const { loans } = useLoans(); // To populate debt payoff dropdown
  
  const [formData, setFormData] = useState({
    goalType: 'savings',
    name: '',
    targetAmount: '',
    currentSaved: '',
    targetDate: '',
    loanId: '',
    targetMonths: ''
  });

  const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { goalType: formData.goalType, name: formData.name };
      
      if (formData.goalType === 'savings') {
        payload.targetAmount = Number(formData.targetAmount);
        payload.currentSaved = Number(formData.currentSaved) || 0;
        payload.targetDate = formData.targetDate;
      } else {
        payload.loanId = formData.loanId;
        payload.targetMonths = Number(formData.targetMonths);
      }

      await addGoal(payload);
      onClose(); 
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Define a Financial Goal">
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
         <div className="flex bg-paper-sunken rounded-lg p-1">
            <button
               type="button"
               onClick={() => setFormData({...formData, goalType: 'savings'})}
               className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${formData.goalType === 'savings' ? 'bg-teal-700 text-white' : 'text-ink-soft hover:text-ink'}`}
            >
               Savings Target
            </button>
            <button
               type="button"
               onClick={() => setFormData({...formData, goalType: 'debt_payoff'})}
               className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${formData.goalType === 'debt_payoff' ? 'bg-teal-700 text-white' : 'text-ink-soft hover:text-ink'}`}
            >
               Accelerate Debt Payoff
            </button>
         </div>

         <div>
           <label className="block text-sm text-ink mb-1">Goal Name</label>
           <input 
              type="text" name="name" value={formData.name} onChange={handleChange} required 
              placeholder={formData.goalType === 'savings' ? "e.g. Dream House Fund" : "e.g. Kill the Auto Loan Early"}
              className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" 
           />
         </div>

         {formData.goalType === 'savings' ? (
           <>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-ink mb-1">Target Amount (₹)</label>
                  <input type="number" name="targetAmount" value={formData.targetAmount} onChange={handleChange} min="1" required className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm text-ink mb-1">Already Saved (₹)</label>
                  <input type="number" name="currentSaved" value={formData.currentSaved} onChange={handleChange} min="0" required className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" />
                </div>
             </div>
             <div>
               <label className="block text-sm text-ink mb-1">Target Date</label>
               <DatePickerInput 
                 selected={formData.targetDate ? new Date(formData.targetDate) : null}
                 onChange={(date) => setFormData(prev => ({...prev, targetDate: date ? date.toISOString().split('T')[0] : ''}))}
                 placeholder="Select Target Date"
                 dateFormat="yyyy-MM-dd"
               />
             </div>
           </>
         ) : (
           <>
             <div>
               <label className="block text-sm text-ink mb-1">Select Active Loan</label>
               <select name="loanId" value={formData.loanId} onChange={handleChange} required className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent">
                  <option value="">-- Choose Loan --</option>
                  {loans?.filter(l => l.status !== 'closed').map(l => (
                     <option key={l.id} value={l.id}>{l.loanType.toUpperCase()} - Pending: ₹{Number(l.outstandingBalance).toLocaleString("en-IN")}</option>
                  ))}
               </select>
             </div>
             <div>
               <label className="block text-sm text-ink mb-1">Time To Payoff (Months)</label>
               <input type="number" name="targetMonths" value={formData.targetMonths} onChange={handleChange} min="1" required placeholder="Shorter than current tenure" className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" />
             </div>
           </>
         )}

         <div className="pt-4 border-t border-border-default flex justify-end gap-3 mt-6">
           <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-sunken transition-colors">Cancel</button>
           <button type="submit" disabled={isAdding} className="accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] flex items-center text-sm disabled:opacity-50">
             {isAdding ? 'Registering...' : 'Add Goal'}
           </button>
         </div>
      </form>
    </Modal>
  );
}
