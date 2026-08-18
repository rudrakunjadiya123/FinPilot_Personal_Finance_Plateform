import React, { useState } from 'react';
import Modal from './primitives/Modal';
import DatePickerInput from './primitives/DatePickerInput';
import { useLendBorrow } from '../hooks/useLendBorrow';
import { Check, AlertCircle } from 'lucide-react';

export default function RepaymentLogModal({ isOpen, onClose, record, remaining }) {
  const { repayRecord, isRepaying } = useLendBorrow();
  const [paymentType, setPaymentType] = useState('principal_only');
  const [payAmount, setPayAmount] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!record) return null;

  const repayments = record.repayments || [];
  const amount = Number(record.amount || 0);

  const totalPrincipalRepaid = record.totalRepaid !== undefined 
    ? record.totalRepaid 
    : repayments.reduce((sum, r) => {
        if (r.paymentType === 'interest_only') return sum;
        if (r.paymentType === 'principal_only' && Number(r.principalAmount) === 0) return sum + Number(r.amount);
        return sum + Number(r.principalAmount || 0);
      }, 0);

  const remainingBal = remaining !== undefined ? remaining : Math.max(0, amount - totalPrincipalRepaid);
  const isLent = record.type === 'lent';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const val = Number(payAmount);
    const intVal = Number(interestAmount) || 0;
    
    // Validations
    if (!val || val <= 0) return;
    if (paymentType === 'principal_only' && val > remainingBal) {
      setErrorMsg(`Principal amount cannot exceed remaining balance (₹${remainingBal.toLocaleString("en-IN")})`);
      return;
    }
    if (paymentType === 'principal_interest' && val > remainingBal) {
      setErrorMsg(`Principal amount cannot exceed remaining balance (₹${remainingBal.toLocaleString("en-IN")})`);
      return;
    }

    try {
      const payload = { id: record.id, paymentType, paymentMode, date };
      if (paymentMode === 'online') {
        payload.transactionId = transactionId;
      }

      if (paymentType === 'principal_only') {
        payload.amount = val;
      } else if (paymentType === 'interest_only') {
        payload.amount = val;
      } else if (paymentType === 'principal_interest') {
        payload.principalAmount = val;
        payload.interestAmount = intVal;
        payload.amount = val + intVal;
      }

      await repayRecord(payload);
      setPayAmount('');
      setInterestAmount('');
      setPaymentType('principal_only');
      setPaymentMode('cash');
      setTransactionId('');
      onClose();
    } catch(err) {
      console.error(err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to register repayment';
      setErrorMsg(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Register Transaction: ${record.personName}`}>
      <div className="space-y-5 font-body">

        {/* Remaining Balance Summary Pill */}
        <div className="bg-paper-sunken border border-border-default rounded-lg p-3.5 flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {isLent ? 'Remaining to Collect' : 'Remaining to Pay'}
          </span>
          <span className={`text-base font-mono font-bold ${remainingBal === 0 ? 'text-emerald-600' : 'text-negative'}`}>
            ₹{remainingBal.toLocaleString("en-IN")}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {remainingBal > 0 || paymentType === 'interest_only' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Repayment Date</label>
                <DatePickerInput 
                  selected={date ? new Date(date) : null}
                  onChange={(d) => setDate(d ? d.toISOString().split('T')[0] : '')}
                  placeholder="Select Repayment Date"
                  dateFormat="yyyy-MM-dd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Repayment Allocation</label>
                <select 
                  value={paymentType} 
                  onChange={(e) => setPaymentType(e.target.value)} 
                  className="w-full rounded-xl border border-border-strong bg-paper px-3 py-2 text-xs outline-none focus:border-accent transition-colors"
                >
                  <option value="principal_only">Principal Only</option>
                  <option value="interest_only">Interest Only</option>
                  <option value="principal_interest">Principal + Interest</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                {paymentType === 'interest_only' 
                  ? 'Interest Amount (₹)' 
                  : (paymentType === 'principal_interest' ? 'Principal Amount (₹)' : (isLent ? 'Amount returned (₹)' : 'Amount paid back (₹)'))}
              </label>
              <input 
                type="number" 
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                max={paymentType !== 'interest_only' ? remainingBal : undefined}
                min="1"
                required
                className="w-full font-mono rounded-xl border border-border-strong bg-paper px-3 py-2 text-xs outline-none focus:border-accent transition-colors"
                placeholder={`Example: ${paymentType === 'interest_only' ? '500' : Math.min(remainingBal, 5000)}`}
              />
            </div>

            {paymentType === 'principal_interest' && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Interest Amount (₹)</label>
                <input 
                  type="number" 
                  value={interestAmount}
                  onChange={(e) => setInterestAmount(e.target.value)}
                  min="0"
                  required
                  className="w-full font-mono rounded-xl border border-border-strong bg-paper px-3 py-2 text-xs outline-none focus:border-accent transition-colors"
                  placeholder="Example: 500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Payment Mode</label>
                <select 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)} 
                  className="w-full rounded-xl border border-border-strong bg-paper px-3 py-2 text-xs outline-none focus:border-accent transition-colors"
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>
              {paymentMode === 'online' && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Transaction ID / Ref No</label>
                  <input 
                    type="text" 
                    value={transactionId} 
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    placeholder="UTR or Ref No."
                    className="w-full font-mono rounded-xl border border-border-strong bg-paper px-3 py-2 text-xs outline-none focus:border-accent transition-colors" 
                  />
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={isRepaying || !payAmount || (paymentType === 'principal_interest' && !interestAmount)}
              className="w-full mt-2 accent-gradient hover:shadow-glow text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-xs disabled:opacity-50 shadow-sm"
            >
              {isRepaying ? 'Registering...' : (isLent ? 'Register Repayment' : 'Register Payment')}
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fully Repaid — This record has been completely settled.</span>
          </div>
        )}

      </div>
    </Modal>
  );
}
