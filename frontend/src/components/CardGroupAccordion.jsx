import React, { useState } from 'react';
import DataTable from './DataTable';
import StatusPill from './primitives/StatusPill';
import PayBillModal from './PayBillModal';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CardGroupAccordion({ cardTitle, bills }) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  // Parse pending amounts globally to identify exactly what's owing out of bounds natively
  const pendingTotal = bills.reduce((sum, b) => {
     if (b.paidStatus === 'paid') return sum;
     const remaining = Number(b.totalAmount) - (Number(b.paidAmount) || 0);
     return sum + remaining;
  }, 0);

  const columns = [
    { label: "Statement Month", render: (item) => new Date(item.statementDate).toLocaleDateString('en-GB') },
    { label: "Due", render: (item) => new Date(item.dueDate).toLocaleDateString('en-GB') },
    { label: "Total Amount", isMonospace: true, render: (item) => `₹${Number(item.totalAmount).toLocaleString("en-IN")}` },
    { label: "Min Due", isMonospace: true, render: (item) => `₹${Number(item.minimumDue).toLocaleString("en-IN")}` },
    { label: "Remaining", isMonospace: true, render: (item) => `₹${(Number(item.totalAmount) - (Number(item.paidAmount)||0)).toLocaleString("en-IN")}` },
    { label: "Status", render: (item) => {
        let statusStr = item.paidStatus;
        const isOverdue = statusStr !== 'paid' && new Date(item.dueDate) < new Date();
        return <StatusPill status={isOverdue ? 'pending' : statusStr} label={isOverdue ? 'OVERDUE' : null} />;
    }},
    { label: "Action", align: "right", render: (item) => (
       item.paidStatus !== 'paid' ? (
         <button 
           onClick={() => setSelectedBill(item)}
           className="text-sm font-medium text-teal-700 bg-teal-100 hover:bg-teal-500 hover:text-white px-3 py-1 rounded-sm transition-colors duration-[120ms]"
         >
           Pay
         </button>
       ) : (
         <span className="text-sm text-ink-faint border border-border-default px-3 py-1 rounded-sm">Paid</span>
       )
    )}
  ];

  return (
    <div className="bg-paper-raised border border-border-default rounded-md overflow-hidden shadow-none mb-6">
      
      {/* Clickable Header Accordion Vector */}
      <div 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between p-6 cursor-pointer hover:bg-paper-sunken transition-colors duration-[180ms] select-none"
      >
         <div className="flex flex-col">
            <h3 className="font-display text-xl text-ink tracking-tight">{cardTitle}</h3>
            <span className="text-sm text-ink-soft mt-1">{bills.length} Processed Bills</span>
         </div>

         <div className="flex items-center gap-6">
            {pendingTotal > 0 ? (
               <div className="flex flex-col items-end text-right">
                 <span className="text-xs uppercase text-ink-soft tracking-wider mb-1">Total Outstanding</span>
                 <span className="text-xl font-mono text-rust-700 tracking-tight">₹{pendingTotal.toLocaleString("en-IN")}</span>
               </div>
            ) : (
               <div className="flex flex-col items-end text-right">
                 <span className="text-xs uppercase text-ink-soft tracking-wider mb-1">Total Outstanding</span>
                 <span className="text-xl font-mono text-ink tracking-tight">Fully Settled</span>
               </div>
            )}
            
            <div className="text-ink-soft p-1">
               {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
         </div>
      </div>

      {isOpen && (
        <div className="border-t border-border-default p-6 bg-paper-sunken/30">
           <DataTable columns={columns} data={bills.sort((a,b) => new Date(b.statementDate) - new Date(a.statementDate))} keyExtractor={item => item.id} />
        </div>
      )}

      {selectedBill && (
        <PayBillModal isOpen={true} onClose={() => setSelectedBill(null)} bill={selectedBill} />
      )}
    </div>
  );
}
