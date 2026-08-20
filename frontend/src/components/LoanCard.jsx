import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './primitives/ProgressBar';
import { ChevronRight, Percent, Calendar } from 'lucide-react';

export default function LoanCard({ loan }) {
  const navigate = useNavigate();

  const total = Number(loan.principalAmount);
  const currentOut = Number(loan.outstandingBalance);
  const paid = total - currentOut;
  const displayTitle = loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) + " Loan";

  return (
    <div 
      onClick={() => navigate(`/app/loans/${loan.id}`)}
      className="bg-paper-raised border border-border-default rounded-xl p-5 cursor-pointer card-hover flex flex-col justify-between group h-full shadow-card relative overflow-hidden"
    >
      {/* Hover accent border effect */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-display text-base font-bold text-ink tracking-tight">{displayTitle}</h3>
          {loan.lenderName && (
            <span className="text-[11px] text-ink-faint mt-0.5 block">{loan.lenderName}</span>
          )}
        </div>
        <span className="text-accent opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5">
          <ChevronRight className="w-5 h-5" />
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <span className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold block mb-0.5">Outstanding Balance</span>
          <span className="text-xl font-mono font-bold text-ink tracking-tight">₹{currentOut.toLocaleString("en-IN")}</span>
        </div>

        <ProgressBar 
          current={paid} 
          max={total} 
          labelLeft={`₹${paid.toLocaleString("en-IN")} paid`}
          labelRight={`of ₹${total.toLocaleString("en-IN")}`} 
          colorVariant="primary" 
        />
        
        <div className="flex items-center gap-3 text-[11px] pt-1">
          <span className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold">
            <Percent className="w-3 h-3" />
            {loan.interestRate}%
          </span>
          <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
            <Calendar className="w-3 h-3" />
            {loan.tenureMonths}mo
          </span>
        </div>
      </div>
    </div>
  );
}
