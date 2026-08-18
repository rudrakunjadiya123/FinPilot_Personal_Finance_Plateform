import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLendBorrow } from '../hooks/useLendBorrow';
import DataTable from '../components/DataTable';
import StatusPill from '../components/primitives/StatusPill';
import { ChevronLeft, Users, Mail } from 'lucide-react';

export default function PersonHistoryPage() {
  const { email } = useParams();
  const { records, isLoading } = useLendBorrow();

  const decodedEmail = decodeURIComponent(email);
  const personRecords = records?.filter(r => r.personEmail === decodedEmail) || [];
  
  if (isLoading) {
    return (
      <div className="text-sm text-ink-soft p-4 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading person history...
      </div>
    );
  }

  if (personRecords.length === 0) {
    return (
      <div className="flex flex-col min-h-full space-y-6">
        <Link to="/lend-borrow" className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-sm font-medium w-fit transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>
        <div className="text-sm text-negative p-4 bg-negative-soft rounded-lg border border-negative/20">No records found for this person.</div>
      </div>
    );
  }

  const personName = personRecords[0].personName;
  
  let netPosition = 0;
  personRecords.forEach(r => {
     const amt = Number(r.amount);
     const repaid = r.repayments?.reduce((sum, rep) => sum + Number(rep.amount), 0) || 0;
     const remaining = amt - repaid;
     if (remaining > 0) {
        if (r.type === 'lent') netPosition += remaining;
        else netPosition -= remaining;
     }
  });

  const columns = [
    { label: "Date", render: (item) => new Date(item.dateGiven).toLocaleDateString('en-GB') },
    { label: "Type", render: (item) => <span className={item.type === 'lent' ? 'text-accent font-semibold' : 'text-info font-semibold'}>{item.type.toUpperCase()}</span> },
    { label: "Principal", isMonospace: true, render: (item) => `₹${Number(item.amount).toLocaleString("en-IN")}` },
    { 
       label: "Remaining", 
       isMonospace: true, 
       render: (item) => {
          const repaid = item.repayments?.reduce((sum, rep) => sum + Number(rep.amount), 0) || 0;
          const remaining = Number(item.amount) - repaid;
          return `₹${remaining.toLocaleString("en-IN")}`;
       } 
    },
    { 
      label: "Status", 
      render: (item) => {
         const repaid = item.repayments?.reduce((sum, rep) => sum + Number(rep.amount), 0) || 0;
         const remaining = Number(item.amount) - repaid;
         const isOverdue = new Date(item.expectedReturnDate) < new Date() && remaining > 0;
         let stat = remaining === 0 ? 'repaid' : (isOverdue ? 'overdue' : (repaid > 0 ? 'partial' : 'pending'));
         return <StatusPill status={stat} label={isOverdue && remaining > 0 ? 'Overdue' : null} />;
      },
      align: 'right'
    }
  ];

  return (
    <div className="flex flex-col min-h-full space-y-6 pb-12">
      <Link to="/lend-borrow" className="flex items-center gap-1.5 text-ink-soft hover:text-accent text-sm font-medium w-fit transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Ledger
      </Link>
      
      {/* Profile Header */}
      <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card flex flex-col md:flex-row gap-8 justify-between relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 right-0 h-[3px] accent-gradient" />
         <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
             {personName?.charAt(0)?.toUpperCase() || 'U'}
           </div>
           <div>
             <h2 className="font-display text-2xl font-bold text-ink tracking-tight">{personName}</h2>
             <p className="text-xs text-ink-faint flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {decodedEmail}</p>
           </div>
         </div>

         <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-border-default pt-4 md:pt-0 md:pl-8">
           <span className="text-[10px] text-ink-faint uppercase tracking-wider font-semibold block mb-1">Net Position</span>
           {netPosition === 0 ? (
             <span className="text-lg font-bold text-positive">Settled ✓</span>
           ) : (
             <span className={`text-2xl font-mono font-bold tracking-tight ${netPosition > 0 ? 'text-accent' : 'text-negative'}`}>
               {netPosition > 0 ? `They owe ₹${netPosition.toLocaleString("en-IN")}` : `You owe ₹${Math.abs(netPosition).toLocaleString("en-IN")}`}
             </span>
           )}
         </div>
      </div>

      <div className="bg-paper-raised border border-border-default rounded-xl overflow-hidden shadow-card">
         <div className="p-5 border-b border-border-default flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
             <Users className="w-4 h-4 text-accent" />
           </div>
           <h3 className="font-display text-base font-bold text-ink">Records ({personRecords.length})</h3>
         </div>
         <div className="p-5 h-[400px] overflow-y-auto w-full">
            <DataTable columns={columns} data={personRecords.sort((a,b) => new Date(b.dateGiven) - new Date(a.dateGiven))} />
         </div>
      </div>
    </div>
  );
}
