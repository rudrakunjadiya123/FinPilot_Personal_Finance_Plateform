import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLoanDetails } from '../hooks/useLoans';
import ProgressBar from '../components/primitives/ProgressBar';
import EMIScheduleTable from '../components/EMIScheduleTable';
import PrepaymentSimulatorPanel from '../components/PrepaymentSimulatorPanel';
import { ChevronLeft, Percent, Calendar, Landmark, Trash2 } from 'lucide-react';

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loan, progress, schedule, isDetailLoading, isScheduleLoading, deleteLoan, isDeleting } = useLoanDetails(id);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this loan? This action cannot be undone.")) {
      try {
        await deleteLoan();
        navigate('/app/loans');
      } catch (err) {
        console.error("Failed to delete loan", err);
        alert("Failed to delete loan. Please try again.");
      }
    }
  };

  if (isDetailLoading || isScheduleLoading) {
    return (
      <div className="text-sm text-ink-soft p-4 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading loan details...
      </div>
    );
  }

  if (!loan) {
    return <div className="text-sm text-negative p-4 bg-negative-soft rounded-lg">Loan could not be found.</div>;
  }

  const displayTitle = loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1) + " Loan";
  const total = Number(loan.principalAmount);
  const currentOut = Number(loan.outstandingBalance);
  const totalPaid = progress?.totalPrincipalPaid || 0; 
  const totalInterestPaid = progress?.totalInterestPaid || 0;

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-12">
      
      {/* Top Actions */}
      <div className="flex justify-between items-center w-full">
        <Link to="/app/loans" className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-sm font-medium w-fit transition-colors duration-150 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back to Loans
        </Link>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 text-negative hover:bg-negative-soft px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? "Deleting..." : "Delete Loan"}
        </button>
      </div>
      
      {/* Header Card */}
      <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card flex flex-col md:flex-row gap-8 justify-between relative overflow-hidden animate-slide-up shrink-0">
        <div className="absolute top-0 left-0 right-0 h-[3px] accent-gradient" />

         <div className="flex-1 w-full max-w-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center">
               <Landmark className="w-5 h-5 text-accent" />
             </div>
             <div>
               <h2 className="font-display text-2xl font-bold text-ink tracking-tight">{displayTitle}</h2>
               <p className="text-xs text-ink-faint">Disbursed {new Date(loan.startDate).toLocaleDateString('en-GB')}</p>
             </div>
           </div>
           
           <div className="mt-6">
             <span className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold block mb-1">Outstanding Balance</span>
             <span className="text-3xl font-mono font-bold text-ink tracking-tight">₹{currentOut.toLocaleString("en-IN")}</span>
           </div>
         </div>

         <div className="flex-1 flex flex-col justify-end space-y-4 border-t md:border-t-0 md:border-l border-border-default pt-4 md:pt-0 md:pl-8">
           <ProgressBar 
              current={totalPaid} 
              max={total} 
              labelLeft={`₹${Number(totalPaid).toLocaleString("en-IN")} principal paid`}
              labelRight={`of ₹${total.toLocaleString("en-IN")}`} 
              colorVariant="primary" 
           />
           <div className="flex justify-between text-sm py-2.5 px-3 bg-paper-sunken rounded-lg border border-border-default">
              <span className="text-ink-soft text-xs">Interest Paid</span>
              <span className="font-mono font-bold text-ink text-sm">₹{Number(totalInterestPaid).toLocaleString("en-IN")}</span>
           </div>
           
           <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1 bg-accent-soft text-accent px-2.5 py-1 rounded-full font-semibold">
                <Percent className="w-3 h-3" /> {loan.interestRate}% p.a.
              </span>
              <span className="inline-flex items-center gap-1 bg-accent-soft text-accent px-2.5 py-1 rounded-full font-semibold">
                <Calendar className="w-3 h-3" /> {loan.tenureMonths} months
              </span>
           </div>
         </div>
      </div>

      <PrepaymentSimulatorPanel loanId={loan.id} currentOutstanding={currentOut} />

      <EMIScheduleTable schedule={schedule} />

    </div>
  );
}
