import React, { useState, useEffect, useRef } from 'react';
import { useLoanDetails } from '../hooks/useLoans';

export default function PrepaymentSimulatorPanel({ loanId, currentOutstanding }) {
  const { simulatePrepayment, isSimulating, commitPrepayment, isCommitting } = useLoanDetails(loanId);
  const [amountStr, setAmountStr] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  // Animation Refs
  const interestSavedRef = useRef(null);
  const tenureSavedRef = useRef(null);

  // Micro-interaction 8: requestAnimationFrame counter for numeric ramping
  const animateValue = (ref, start, end, duration, formatCurrency) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOut map
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * (end - start) + start);
      
      if (ref.current) {
        ref.current.innerText = formatCurrency 
          ? `₹${current.toLocaleString("en-IN")}` 
          : `${current} Months`;
      }
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const handleSimulate = async () => {
    const amount = Number(amountStr);
    if (!amount || amount <= 0 || amount > currentOutstanding) return;

    try {
      const result = await simulatePrepayment(amount);
      setSimulationResult(result);
      
      const tenureReduction = result.monthsReduced ?? result.monthsSaved ?? 0;

      // Trigger animations
      setTimeout(() => {
        animateValue(interestSavedRef, 0, result.interestSaved, 400, true);
        animateValue(tenureSavedRef, 0, tenureReduction, 400, false);
      }, 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommit = async () => {
    const amount = Number(amountStr);
    if (!amount || !simulationResult) return;
    try {
      await commitPrepayment(amount);
      setAmountStr('');
      setSimulationResult(null);
    } catch(err) {
      console.error(err);
    }
  }

  return (
    <div className="bg-paper-raised border border-border-strong rounded-xl p-6 mt-6">
      <h3 className="text-lg font-display text-accent tracking-tight mb-2">Prepayment Simulator</h3>
      <p className="text-sm text-ink-soft mb-6">See exactly how much interest and tenure you save before committing to a prepayment.</p>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
           <div>
             <label className="block text-sm text-ink mb-1">Prepayment Amount (₹)</label>
             <input 
               type="number" 
               value={amountStr}
               onChange={(e) => {
                  setAmountStr(e.target.value);
                  setSimulationResult(null); // invalidate state immediately 
               }}
               max={currentOutstanding}
               className="w-full font-mono rounded-lg border border-border-strong bg-paper-sunken px-3 py-2 text-sm focus:border-accent outline-none transition-colors"
               placeholder="Example: 50000"
             />
           </div>
           
           <button 
             onClick={handleSimulate}
             disabled={!amountStr || isSimulating || simulationResult !== null}
             className="w-full bg-paper-sunken hover:bg-border-default border border-border-strong text-ink font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] text-sm disabled:opacity-50"
           >
             {isSimulating ? 'Crunching numbers...' : 'Simulate Saved'}
           </button>
        </div>

        <div className="flex-1 bg-paper border border-border-default border-dashed rounded-lg p-4 min-h-[160px] flex flex-col justify-center items-center text-center">
           {!simulationResult ? (
              <span className="text-sm text-ink-faint">Enter an amount and hit simulate.</span>
           ) : (
              <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-around items-end">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-ink-soft uppercase tracking-wider mb-1">Interest Saved</span>
                    <span ref={interestSavedRef} className="text-2xl font-mono text-warning font-medium tracking-tight">₹0</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-ink-soft uppercase tracking-wider mb-1">Tenure Stripped</span>
                    <span ref={tenureSavedRef} className="text-2xl font-mono text-accent font-medium tracking-tight">0 Months</span>
                  </div>
                </div>
                
                <button
                  onClick={handleCommit}
                  disabled={isCommitting}
                  className="w-full accent-gradient hover:shadow-glow text-white font-medium py-2 px-4 rounded-lg transition-colors duration-[120ms] text-sm disabled:opacity-50"
                >
                  {isCommitting ? 'Committing Prepayment...' : 'Confirm Prepayment'}
                </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
