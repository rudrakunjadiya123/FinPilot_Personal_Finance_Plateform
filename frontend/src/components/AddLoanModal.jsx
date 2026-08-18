import React, { useState } from 'react';
import Modal from './primitives/Modal';
import DatePickerInput from './primitives/DatePickerInput';
import { useLoans } from '../hooks/useLoans';

export default function AddLoanModal({ isOpen, onClose }) {
  const { addLoan, isAddingLoan } = useLoans();
  
  const [formData, setFormData] = useState({
    loanType: 'personal',
    lenderName: '',
    principalAmount: '',
    interestRate: '',
    tenureMonths: '',
    startDate: ''
  });

  const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addLoan({
        loanType: formData.loanType,
        lenderName: formData.lenderName || undefined,
        principalAmount: Number(formData.principalAmount),
        interestRate: Number(formData.interestRate),
        tenureMonths: Number(formData.tenureMonths),
        startDate: formData.startDate
      });
      onClose();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Loan">
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink mb-1">Loan Type</label>
            <select 
              name="loanType" 
              value={formData.loanType} 
              onChange={handleChange}
              className="w-full rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm focus:border-accent focus:outline outline-2 outline-offset-1 outline-teal-700 transition-colors"
            >
              <option value="personal">Personal Loan</option>
              <option value="home">Home Loan</option>
              <option value="auto">Auto Loan</option>
              <option value="education">Education Loan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-ink mb-1">Lender / Bank Name</label>
            <input 
              type="text" 
              name="lenderName"
              placeholder="e.g. HDFC, ICICI, SBI"
              value={formData.lenderName}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm focus:border-accent outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink mb-1">Principal Amount (₹)</label>
          <input 
            type="number" 
            name="principalAmount"
            value={formData.principalAmount}
            onChange={handleChange}
            required min="1"
            className="w-full rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm font-mono focus:border-accent outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ink mb-1">Interest Rate (% p.a.)</label>
            <input 
              type="number" step="0.1" 
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              required min="0.1"
              className="w-full font-mono rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-ink mb-1">Tenure (Months)</label>
            <input 
              type="number" 
              name="tenureMonths"
              value={formData.tenureMonths}
              onChange={handleChange}
              required min="1"
              className="w-full font-mono rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink mb-1">Start Date</label>
          <DatePickerInput 
            selected={formData.startDate ? new Date(formData.startDate) : null}
            onChange={(date) => handleChange({ target: { name: 'startDate', value: date ? date.toISOString().split('T')[0] : '' } })}
            placeholder="Select Start Date"
            dateFormat="yyyy-MM-dd"
            className="bg-paper-sunken"
          />
        </div>

        <div className="pt-4 border-t border-border-default flex justify-end gap-3 mt-6">
           <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-sunken transition-colors">Cancel</button>
           <button type="submit" disabled={isAddingLoan} className="accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] ease-out-soft flex items-center text-sm disabled:opacity-50">
             {isAddingLoan ? 'Saving...' : 'Add Loan'}
           </button>
        </div>
      </form>
    </Modal>
  );
}
