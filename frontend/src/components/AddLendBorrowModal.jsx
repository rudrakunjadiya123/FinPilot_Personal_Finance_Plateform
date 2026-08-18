import React, { useState } from 'react';
import Modal from './primitives/Modal';
import DatePickerInput from './primitives/DatePickerInput';
import { useLendBorrow } from '../hooks/useLendBorrow';

export default function AddLendBorrowModal({ isOpen, onClose }) {
  const { addRecord, isAdding } = useLendBorrow();
  
  const [formData, setFormData] = useState({
    type: 'lent',
    personName: '',
    personEmail: '',
    dateGiven: new Date().toISOString().split('T')[0],
    amount: '',
    expectedReturnDate: '',
    interestRate: '',
    interestType: 'simple',
    compoundingFrequency: 12, // Default yearly
    interestStartDate: '',
    paymentMode: 'cash',
    transactionId: '',
  });

  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await addRecord({
        ...formData,
        amount: Number(formData.amount),
        interestRate: formData.interestRate ? Number(formData.interestRate) : undefined,
        interestType: formData.interestType,
        compoundingFrequency: formData.interestType === 'compound' ? Number(formData.compoundingFrequency) : undefined,
        interestStartDate: formData.interestStartDate ? formData.interestStartDate : undefined,
        transactionId: formData.paymentMode === 'online' ? formData.transactionId : undefined
      });
      onClose(); // Automatically exit natively closing bounds map without reloading!
    } catch(err) {
      console.error(err);
      const msg = err.response?.data?.error?.message 
        || (err.response?.data?.error?.details && err.response.data.error.details.map(d => d.message).join(', '))
        || err.response?.data?.message 
        || err.message 
        || 'Failed to create record';
      setErrorMsg(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Record">
      <form onSubmit={handleSubmit} className="space-y-4 font-body">
         {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-200 animate-in fade-in">
               {errorMsg}
            </div>
         )}
         <div className="flex bg-paper-sunken rounded-lg p-1">
            <button
               type="button"
               onClick={() => setFormData({...formData, type: 'lent'})}
               className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${formData.type === 'lent' ? 'bg-teal-700 text-white' : 'text-ink-soft hover:text-ink'}`}
            >
               I Lent Money
            </button>
            <button
               type="button"
               onClick={() => setFormData({...formData, type: 'borrowed'})}
               className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${formData.type === 'borrowed' ? 'bg-teal-700 text-white' : 'text-ink-soft hover:text-ink'}`}
            >
               I Borrowed Money
            </button>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink mb-1">Person's Name</label>
              <input 
                 type="text" 
                 name="personName" value={formData.personName} onChange={handleChange} required
                 className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" 
              />
            </div>
            <div>
              <label className="block text-sm text-ink mb-1">Email Address</label>
              <input 
                 type="email" 
                 name="personEmail" value={formData.personEmail} onChange={handleChange} required
                 className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" 
              />
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ink mb-1">Date Given</label>
              <DatePickerInput 
                selected={formData.dateGiven ? new Date(formData.dateGiven) : null}
                onChange={(date) => handleChange({ target: { name: 'dateGiven', value: date ? date.toISOString().split('T')[0] : '' } })}
                placeholder="Select Date Given"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div>
              <label className="block text-sm text-ink mb-1">Amount Principal (₹)</label>
              <input 
                type="number" 
                name="amount" value={formData.amount} onChange={handleChange} min="1" required
                className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" 
              />
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm text-ink mb-1">Expected Return Date</label>
               <DatePickerInput 
                 selected={formData.expectedReturnDate ? new Date(formData.expectedReturnDate) : null}
                 onChange={(date) => handleChange({ target: { name: 'expectedReturnDate', value: date ? date.toISOString().split('T')[0] : '' } })}
                 placeholder="Select Return Date"
                 dateFormat="yyyy-MM-dd"
               />
            </div>
             <div>
               <label className="block text-sm text-ink mb-1">Interest % (Optional)</label>
               <input 
                 type="number" step="0.1"
                 name="interestRate" value={formData.interestRate} onChange={handleChange}
                 className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" 
               />
             </div>
          </div>

          {formData.interestRate && formData.interestRate > 0 && (
            <div className="grid grid-cols-2 gap-4 bg-paper-sunken p-3 rounded-xl border border-border-default">
               <div>
                  <label className="block text-sm text-ink mb-1">Interest Type</label>
                  <select name="interestType" value={formData.interestType} onChange={handleChange} className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent">
                     <option value="simple">Simple</option>
                     <option value="compound">Compound</option>
                  </select>
               </div>
               
               {formData.interestType === 'compound' ? (
                 <div>
                    <label className="block text-sm text-ink mb-1">Compounding Rate</label>
                    <select name="compoundingFrequency" value={formData.compoundingFrequency} onChange={handleChange} className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent">
                       <option value={1}>Monthly</option>
                       <option value={3}>Quarterly</option>
                       <option value={6}>Semi-Annually</option>
                       <option value={12}>Yearly</option>
                    </select>
                 </div>
               ) : (
                 <div>
                  <label className="block text-sm text-ink mb-1">Start Date (Optional)</label>
                  <DatePickerInput 
                    selected={formData.interestStartDate ? new Date(formData.interestStartDate) : null}
                    onChange={(date) => handleChange({ target: { name: 'interestStartDate', value: date ? date.toISOString().split('T')[0] : '' } })}
                    placeholder="Select Start Date"
                    dateFormat="yyyy-MM-dd"
                  />
                 </div>
               )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm text-ink mb-1">Payment Mode</label>
               <select name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent">
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
               </select>
            </div>
            {formData.paymentMode === 'online' && (
              <div>
                 <label className="block text-sm text-ink mb-1">Transaction ID / Ref No</label>
                 <input 
                   type="text" 
                   name="transactionId" value={formData.transactionId} onChange={handleChange} required
                   placeholder="UTR or Ref No."
                   className="w-full font-mono rounded-lg border border-border-strong bg-paper px-3 py-2 text-sm outline-none focus:border-accent" 
                 />
              </div>
            )}
         </div>

         <div className="pt-4 border-t border-border-default flex justify-end gap-3 mt-6">
           <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft hover:bg-paper-sunken transition-colors">Cancel</button>
           <button type="submit" disabled={isAdding} className="accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] ease-out-soft flex items-center text-sm disabled:opacity-50">
             {isAdding ? 'Attaching...' : 'Add Record'}
           </button>
         </div>
      </form>
    </Modal>
  );
}
