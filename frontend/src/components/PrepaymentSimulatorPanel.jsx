import React, { useState } from 'react';
import { useLoanDetails } from '../hooks/useLoans';
import { formatCurrency } from '../utils/formatters';
import { Calculator, ArrowRight, ShieldCheck, Clock, PiggyBank, Sparkles } from 'lucide-react';

export default function PrepaymentSimulatorPanel({ loanId, currentOutstanding }) {
  const { simulatePrepayment, isSimulating, commitPrepayment, isCommitting } = useLoanDetails(loanId);
  const [amountStr, setAmountStr] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [prepayStrategy, setPrepayStrategy] = useState('tenure'); // 'tenure' | 'emi'

  // Presets for quick selection
  const presets = [25000, 50000, 100000, 200000].filter(p => p <= currentOutstanding);

  const handleSimulate = async () => {
    const amount = Number(amountStr);
    if (!amount || amount <= 0 || amount > currentOutstanding) return;

    try {
      const result = await simulatePrepayment(amount);
      setSimulationResult(result);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  const handleCommit = async () => {
    const amount = Number(amountStr);
    if (!amount || !simulationResult) return;
    try {
      await commitPrepayment(amount);
      setAmountStr('');
      setSimulationResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-display font-bold text-ink tracking-tight">Loan Prepayment Simulator</h3>
        </div>
        <p className="text-xs text-ink-soft mt-0.5">
          Calculate the exact interest savings and tenure reduction before committing additional capital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input Configuration */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              Lump-Sum Prepayment Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-faint">₹</span>
              <input 
                type="number" 
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setSimulationResult(null);
                }}
                max={currentOutstanding}
                className="w-full font-mono rounded-xl border border-border-default bg-paper-sunken pl-8 pr-4 py-2.5 text-sm font-semibold text-ink focus:border-accent focus:bg-paper-raised outline-none transition-all"
                placeholder="50,000"
              />
            </div>
            {/* Quick preset buttons */}
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presets.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setAmountStr(p.toString());
                      setSimulationResult(null);
                    }}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono border border-border-default bg-paper-sunken hover:bg-paper-raised text-ink-soft hover:text-ink transition-colors"
                  >
                    +₹{p >= 100000 ? `${p / 100000}L` : `${p / 1000}K`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strategy selection */}
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">
              Optimization Objective
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrepayStrategy('tenure')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  prepayStrategy === 'tenure' 
                    ? 'border-accent bg-accent-soft/40 text-accent font-semibold shadow-sm' 
                    : 'border-border-default bg-paper-sunken text-ink-soft hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reduce Tenure</span>
                </div>
                <span className="text-[10px] text-ink-faint font-normal block">
                  Keep EMI same, finish debt months earlier
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPrepayStrategy('emi')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  prepayStrategy === 'emi' 
                    ? 'border-accent bg-accent-soft/40 text-accent font-semibold shadow-sm' 
                    : 'border-border-default bg-paper-sunken text-ink-soft hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  <span>Lower Monthly EMI</span>
                </div>
                <span className="text-[10px] text-ink-faint font-normal block">
                  Keep tenure same, ease monthly cash flow
                </span>
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSimulate}
            disabled={!amountStr || isSimulating || Number(amountStr) <= 0 || Number(amountStr) > currentOutstanding}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-white shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSimulating ? 'Calculating Amortization Impact...' : 'Simulate Prepayment Savings'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results Panel */}
        <div className="bg-paper-sunken border border-border-default rounded-xl p-5 min-h-[220px] flex flex-col justify-center">
          {!simulationResult ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-paper-raised border border-border-default mx-auto flex items-center justify-center text-ink-faint">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h4 className="text-xs font-semibold text-ink">Simulate Before Committing</h4>
              <p className="text-[11px] text-ink-soft max-w-xs mx-auto leading-relaxed">
                Enter an amount to see exactly how much overall interest you strip away and how early you achieve debt freedom.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border-default">
                <span className="text-xs font-semibold text-ink">Estimated Outcome</span>
                <span className="text-[10px] text-ink-faint">Mathematical Projection</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-paper-raised p-3.5 rounded-xl border border-border-default">
                  <span className="text-[10px] font-semibold text-ink-faint uppercase block">Total Interest Saved</span>
                  <div className="text-xl font-mono font-bold text-positive mt-1">
                    {formatCurrency(simulationResult.interestSaved || 0)}
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">Direct financial savings</span>
                </div>

                <div className="bg-paper-raised p-3.5 rounded-xl border border-border-default">
                  <span className="text-[10px] font-semibold text-ink-faint uppercase block">Tenure Reduction</span>
                  <div className="text-xl font-mono font-bold text-accent mt-1">
                    {simulationResult.monthsReduced || simulationResult.monthsSaved || 0} Months
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">Debt-free earlier</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-positive-soft/50 border border-positive/20 text-[11px] text-positive-dark flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-positive shrink-0" />
                <span>Prepaying {formatCurrency(amountStr)} saves {formatCurrency(simulationResult.interestSaved || 0)} in cumulative interest!</span>
              </div>

              <button
                type="button"
                onClick={handleCommit}
                disabled={isCommitting}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isCommitting ? 'Applying to Active Loan...' : 'Confirm & Record Prepayment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
