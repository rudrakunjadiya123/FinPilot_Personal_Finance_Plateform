import React from 'react';
import DataTable from './DataTable';

export default function EMIScheduleTable({ schedule }) {
  const columns = [
    { label: "Date", key: "dueDate", render: (item) => new Date(item.dueDate).toLocaleDateString('en-GB') },
    { label: "Principal", key: "principalComponent", isMonospace: true, render: (item) => `₹${Number(item.principalComponent).toLocaleString("en-IN")}` },
    { label: "Interest", key: "interestComponent", isMonospace: true, render: (item) => `₹${Number(item.interestComponent).toLocaleString("en-IN")}` },
    { label: "Balance", key: "remainingBalance", isMonospace: true, render: (item) => `₹${Number(item.remainingBalance).toLocaleString("en-IN")}` },
    { 
      label: "Status", 
      render: (item) => (
        <span className={`px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-wider ${
          item.isPaid ? 'bg-gold-100 text-warning' : 'bg-paper-sunken text-ink-soft'
        }`}>
          {item.isPaid ? 'Paid' : 'Pending'}
        </span>
      ),
      align: 'right'
    }
  ];

  return (
    <div className="bg-paper-raised border border-border-default rounded-xl p-6 mt-6">
      <h3 className="text-lg font-display text-ink tracking-tight mb-4">Amortization Schedule</h3>
      <div className="h-[400px] overflow-y-auto w-full">
         <DataTable columns={columns} data={schedule} keyExtractor={(s) => s.id} emptyMessage="No EMI generated." />
      </div>
    </div>
  );
}
