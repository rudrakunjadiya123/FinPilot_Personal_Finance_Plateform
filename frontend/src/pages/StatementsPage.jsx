import React, { useState, useRef, useEffect } from 'react';
import { useStatements } from '../hooks/useStatements';
import { useUploadContext } from '../context/UploadContext';
import {
  Upload, Download, Sparkles, List, Check,
  History, Clock, FileText, CheckCircle2, XCircle, Search, Landmark, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const VALID_CATEGORIES = [
  "Food", "Groceries", "Rent", "Fuel", "Shopping",
  "Entertainment", "Medical", "Travel", "Education",
  "Utilities", "Investment", "Salary", "Transfer", "Bills", "Others"
];

const COLORS = {
  Food: '#ef4444', Groceries: '#f97316', Rent: '#eab308', Fuel: '#84cc16',
  Shopping: '#22c55e', Entertainment: '#06b6d4', Medical: '#3b82f6',
  Travel: '#8b5cf6', Education: '#a855f7', Utilities: '#ec4899',
  Investment: '#14b8a6', Salary: '#10b981', Transfer: '#6b7280', Bills: '#f43f5e', Others: '#94a3b8',
};

export default function StatementsPage() {
  const now = new Date();
  
  // ── Global Context ──
  const { uploadTask, isUploading: isGlobalUploading, progress, status: uploadStatus, recentUploadData, clearRecentData } = useUploadContext();

  // ── Filter State ──
  const [timePeriod, setTimePeriod] = useState('last_month');
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statementType, setStatementType] = useState('both');
  
  const [bankNameStr, setBankNameStr] = useState("all"); 
  const [selectedCategory, setSelectedCategory] = useState("all"); 
  
  // Custom Debounce for LLM token limiting across rapid UI renders
  const [debouncedPayload, setDebouncedPayload] = useState({});

  let actualStartDate = customStart;
  let actualEndDate = customEnd;
  if (timePeriod === 'last_month') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    actualStartDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    actualEndDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  } else if (timePeriod === 'last_3_months') {
    const d = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    actualStartDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    actualEndDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  } else if (timePeriod === 'this_month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    actualStartDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    actualEndDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  }
  
  const [submittedPayload, setSubmittedPayload] = useState({});


  // Populate first load securely on mount only if empty
  useEffect(() => {
    handleApplyFilters();
  }, []);

  const handleApplyFilters = () => {
    setSubmittedPayload({
      startDate: actualStartDate,
      endDate: actualEndDate,
      statementType,
      bankName: bankNameStr === 'all' ? '' : bankNameStr, 
      categories: selectedCategory === 'all' ? [] : [selectedCategory]
    });
  };

  // Redirect instantly to newly uploaded data Insights
  useEffect(() => {
    if (uploadStatus === 'completed' && recentUploadData) {
      if (recentUploadData.params?.monthKey) {
        setTimePeriod('custom');
        const [y, m] = recentUploadData.params.monthKey.split('-');
        if (y && m) {
           const lastDay = new Date(y, m, 0);
           const mStart = `${y}-${String(m).padStart(2,'0')}-01`;
           const mEnd = `${y}-${String(m).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
           setCustomStart(mStart);
           setCustomEnd(mEnd);
           
           if (recentUploadData.params.bankName) setBankNameStr(recentUploadData.params.bankName);
           if (recentUploadData.params.statementType) setStatementType(recentUploadData.params.statementType);

           setSubmittedPayload({
              startDate: mStart,
              endDate: mEnd,
              statementType: recentUploadData.params.statementType || 'both',
              bankName: recentUploadData.params.bankName || '',
              categories: []
           });
           
           if (recentUploadData.transactionsParsed === 0) {
             alert(`Upload finished, but 0 valid transactions were found for ${recentUploadData.params.monthKey}.`);
           }
        }
        clearRecentData();
      }
    }
  }, [uploadStatus, recentUploadData]);

  // ── UI State ──
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const reportRef = useRef(null);

  const {
    dashboard, isDashboardLoading,
    uploads, uniqueBanks, expenseTrend, 
    uploadStatement, isUploading,
    correctCategory, aiInsights, isInsightsLoading
  } = useStatements(submittedPayload);

  const handleUpload = (e) => {
    e.preventDefault();
    const form = e.target;
    const file = form.file.files[0];
    const upStatementType = form.statementType.value;
    const upBankName = form.bankName.value;
    const uploadMonth = form.uploadMonth.value;

    if (!file) return;
    
    // Globally process, detach from localized hook!
    uploadTask({ file, monthKey: uploadMonth, statementType: upStatementType, bankName: upBankName })
      .catch((err) => alert('Upload failed: ' + (err.response?.data?.error?.message || err.message)));
    
    setShowUploadModal(false);
    form.reset();
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, Math.min(h, pdf.internal.pageSize.getHeight()));
    pdf.save(`FinPilot_Filtered_Report.pdf`);
  };

  const exportCSV = () => {
    if (!dashboard?.transactions || dashboard.transactions.length === 0) return;
    const headers = ["Date", "Description", "Category", "Source", "Type", "Ref No", "Amount", "Balance"];
    const rows = dashboard.transactions.map(tx => [
      new Date(tx.date).toISOString().split('T')[0],
      `"${tx.descriptionRaw.replace(/"/g, '""')}"`,
      tx.category || "Uncategorized",
      `"${tx.statementUpload?.bankName || ''} - ${tx.statementUpload?.statementType || ''}"`,
      tx.type,
      tx.refNo || "",
      tx.amount,
      tx.balance || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FinPilot_Combined_Statement.csv");
    document.body.appendChild(link);
    link.click();
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const fmtBal = (n) => n ? Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

  return (
    <div className="flex flex-col gap-6 pb-20">

      {/* ── Header & Upload ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
           <h1 className="text-xl font-display font-bold text-ink tracking-tight flex items-center gap-2">Statements & AI</h1>
           <p className="text-xs text-ink-faint mt-0.5">Intelligent statement analysis</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
           <button onClick={() => setShowHistoryModal(true)} className="bg-paper-sunken hover:bg-paper border border-border-strong px-4 py-2 rounded-lg text-sm font-semibold text-ink transition-all duration-200 flex items-center gap-2 btn-press">
             <History className="w-4 h-4 text-accent" /> History
           </button>
           <button onClick={exportCSV} className="bg-paper-sunken hover:bg-paper border border-border-strong px-4 py-2 rounded-lg text-sm font-semibold text-ink transition-all duration-200 flex items-center gap-2 btn-press">
             <Download className="w-4 h-4 text-ink-soft" /> CSV
           </button>
           <button onClick={exportPDF} className="bg-paper-sunken hover:bg-paper border border-border-strong px-4 py-2 rounded-lg text-sm font-semibold text-ink transition-all duration-200 flex items-center gap-2 btn-press">
             <Download className="w-4 h-4 text-ink-soft" /> PDF
           </button>
           <button onClick={() => setShowUploadModal(true)} className="accent-gradient hover:shadow-glow text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 btn-press">
             <Upload className="w-4 h-4" /> Upload
           </button>
        </div>
      </div>

      {/* ── Global Upload Progress Element ── */}
      {uploadStatus !== 'idle' && (
        <div className="flex bg-paper-raised border border-accent/20 shadow-card rounded-xl p-4 my-2 items-center justify-between animate-slide-down">
           <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center bg-accent-soft rounded-xl shrink-0">
                 {uploadStatus === 'completed' ? (
                    <Check className="w-5 h-5 text-accent" />
                 ) : (
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-border-default"
                        strokeWidth="3" stroke="currentColor" fill="none"
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-accent transition-all duration-300 ease-out"
                        strokeDasharray={`${progress}, 100`}
                        strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none"
                        d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                 )}
                 {uploadStatus !== 'completed' && <span className="absolute text-[10px] font-bold text-white font-mono">{progress}%</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-ink">
                   {uploadStatus === 'uploading' && 'Securely transferring document...'}
                   {uploadStatus === 'processing' && 'Synthesizing Statement AI Patterns...'}
                   {uploadStatus === 'completed' && 'Insight extraction completed Successfully!'}
                   {uploadStatus === 'failed' && 'Upload Failed.'}
                </span>
                <span className="text-xs text-ink-soft">
                   {uploadStatus === 'processing' ? 'This might take a minute, you can navigate away.' : (uploadStatus === 'completed' ? 'Auto-refreshing view.' : 'Connecting...')}
                </span>
              </div>
           </div>
        </div>
      )}

      {/* ── Master Filters (Top Right Requirement Implemented As Secondary Nav Bar) ── */}
      <div className="bg-paper-raised rounded-xl border border-border-default px-5 py-4 flex flex-wrap items-start md:items-end justify-between gap-6 shadow-card">
         <div className="flex flex-wrap items-end gap-5 flex-1 w-full justify-between lg:justify-end">
             <div className="flex flex-col gap-1.5 w-40">
               <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Time Period</label>
               <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="border border-border-strong rounded-lg px-3 py-2 text-sm bg-paper-sunken outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-ink font-medium transition-all duration-200">
                 <option value="this_month">This Month</option>
                 <option value="last_month">Last Month</option>
                 <option value="last_3_months">Last 3 Months</option>
                 <option value="custom">Custom Range</option>
               </select>
             </div>

             {timePeriod === 'custom' && (
               <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Custom Window</label>
                 <div className="flex items-center gap-2 bg-paper rounded-xl border border-border-strong shadow-sm overflow-hidden">
                   <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-1 text-sm bg-transparent outline-none font-medium" />
                   <span className="text-ink-soft font-mono text-xs px-2 bg-paper-sunken py-1.5">—</span>
                   <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-1 text-sm bg-transparent outline-none font-medium" />
                 </div>
               </div>
             )}

             <div className="flex flex-col gap-1.5 w-44">
               <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Statement Type</label>
               <select value={statementType} onChange={(e) => setStatementType(e.target.value)} className="border border-border-strong rounded-lg px-3 py-2 text-sm bg-paper-sunken outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-ink font-medium transition-all duration-200">
                 <option value="both">Both</option>
                 <option value="bank_account">Bank Statement</option>
                 <option value="credit_card">Credit Card Statement</option>
               </select>
             </div>

             <div className="flex flex-col gap-1.5 w-44 lg:w-48">
               <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Banks</label>
               <select value={bankNameStr} onChange={(e) => setBankNameStr(e.target.value)} className="border border-border-strong rounded-lg px-3 py-2 text-sm bg-paper-sunken outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-ink font-medium transition-all duration-200">
                 <option value="all">All</option>
                 {(uniqueBanks || []).map(b => <option key={b} value={b}>{b}</option>)}
               </select>
             </div>

             <div className="flex flex-col gap-1.5 w-44 lg:w-48">
               <label className="text-xs font-semibold text-ink-soft uppercase tracking-wide">Categories</label>
               <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border border-border-strong rounded-lg px-3 py-2 text-sm bg-paper-sunken outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-ink font-medium transition-all duration-200">
                 <option value="all">All</option>
                 {VALID_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>

             <div className="flex flex-col gap-1.5 justify-end h-[52px]">
               <button 
                 onClick={handleApplyFilters}
                 className="accent-gradient hover:shadow-glow text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 h-[36px] flex items-center justify-center whitespace-nowrap btn-press"
               >
                 Generate Insights
               </button>
             </div>
         </div>
      </div>

      <div ref={reportRef} className="flex flex-col gap-6 bg-paper rounded-xl pb-10">

          {/* ── AI Insights Box ── */}
          <div className="bg-gradient-to-br from-[#1A1A2E] to-[#2A1F0E] rounded-xl p-7 text-white shadow-elevated relative overflow-hidden group">
            <Sparkles className="absolute top-6 right-6 w-32 h-32 text-accent/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000 ease-out" />
            
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-3 text-accent drop-shadow-md">
              <span className="p-1.5 bg-accent/20 rounded-lg shadow-inner border border-accent/20"><Sparkles className="w-5 h-5 text-accent" /></span>
              AI Intelligence
            </h2>
            
            <div className="relative z-10 text-slate-100 font-medium text-sm/relaxed max-w-4xl font-body whitespace-pre-line tracking-wide">
              {isInsightsLoading ? (
                <span className="flex items-center gap-2 opacity-80 animate-pulse text-accent">
                  Analyzing your financial patterns...
                </span>
              ) : (
                aiInsights || "Insufficient data within these exact filters to compute AI Insights."
              )}
            </div>
          </div>

          {/* ── KPI Blocks ── */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-paper-raised border border-border-default rounded-xl p-5 relative overflow-hidden card-hover shadow-card">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-accent"></div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">Total Income</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-ink">₹{fmt(dashboard.totalIncome)}</p>
              </div>
              <div className="bg-paper-raised border border-border-default rounded-xl p-5 relative overflow-hidden card-hover shadow-card">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-negative"></div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">Total Expenses</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-ink">₹{fmt(dashboard.totalExpense)}</p>
              </div>
              <div className="bg-paper-raised border border-border-default rounded-xl p-5 relative overflow-hidden card-hover shadow-card">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-info"></div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">Filtered Savings</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-ink">₹{fmt(dashboard.totalSavings)}</p>
              </div>
              <div className="bg-paper-raised border border-border-default rounded-xl p-5 relative overflow-hidden card-hover shadow-card flex flex-col justify-between">
                <div>
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-warning"></div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-1">Transactions</p>
                    <p className="text-2xl font-mono font-bold tracking-tight text-ink">{dashboard.transactionCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Split Charts ── */}
          {dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Requirements: Category Bar Chart */}
              <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card">
                <h3 className="font-display font-bold text-base mb-6 flex items-center gap-2 text-ink">Category Breakdown</h3>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.categoryBreakdown || []} margin={{ top: 0, right: 0, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-line)" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={50} tick={{ fontSize: 11 }} />
                      <RechartsTooltip cursor={{fill: 'var(--color-accent-glow)', opacity: 0.3}} contentStyle={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-border-default)', borderRadius: '10px', boxShadow: 'var(--shadow-elevated)' }} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        {(dashboard.categoryBreakdown || []).map((entry, i) => (
                          <Cell key={i} fill={COLORS[entry.category] || '#94a3b8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

               {/* Requirements: Expense Trend Line Chart */}
               <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card">
                <h3 className="font-display font-bold text-base mb-6 flex items-center gap-2 text-ink">Expense Trend</h3>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expenseTrend || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-line)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.substring(5)} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={50} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                      <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} animationDuration={1000} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* ── Combined Statement Dataset ── */}
          {dashboard && (
            <div className="bg-paper border border-border-default rounded-xl overflow-hidden shadow-sm mt-4">
              <div className="bg-paper px-6 py-5 border-b border-border-default flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg text-ink">Combined Statement View</h3>
                  <p className="text-sm font-medium text-ink-soft">Aggregated data across banks and credit cards respecting active filters.</p>
                </div>
              </div>
              
              {dashboard?.transactions?.length === 0 ? (
                 <div className="p-10 text-center flex flex-col justify-center items-center">
                    <List className="w-12 h-12 text-ink-faint mb-3 opacity-30" />
                    <p className="text-base font-semibold text-ink-soft">No transactions found.</p>
                    <p className="text-sm text-ink-faint mt-1">Adjust your filters or upload a statement for this specific period.</p>
                 </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-paper-raised text-ink-soft sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-xs tracking-wider uppercase">Date</th>
                      <th className="px-6 py-4 text-left font-semibold text-xs tracking-wider uppercase hidden md:table-cell">Source / Card Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-xs tracking-wider uppercase">Description</th>
                      <th className="px-6 py-4 text-left font-semibold text-xs tracking-wider uppercase">Category</th>
                      <th className="px-6 py-4 text-left font-semibold text-xs tracking-wider uppercase hidden lg:table-cell">Ref No</th>
                      <th className="px-6 py-4 text-right font-semibold text-xs tracking-wider uppercase">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-strong">
                    {dashboard.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-paper-sunken/60 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-ink-soft font-mono text-[13px] group-hover:text-ink transition-colors">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                           <div className="flex flex-col">
                              <span className="font-medium text-ink-soft">{tx.statementUpload?.bankName || 'Unknown Bank'}</span>
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{(tx.statementUpload?.statementType || '').replace('_', ' ')}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 max-w-[280px]">
                          <p className="truncate font-medium text-ink" title={tx.descriptionRaw}>{tx.descriptionNormalized || tx.descriptionRaw}</p>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded bg-accent-soft border border-teal-100 text-[11px] font-bold text-accent`}>
                              {tx.category || 'Uncategorized'}
                            </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-ink-soft capitalize whitespace-nowrap hidden lg:table-cell">
                          {tx.refNo || '—'}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-medium whitespace-nowrap text-base ${tx.type === 'debit' ? 'text-red-600' : 'text-accent'}`}>
                          {tx.type === 'debit' ? '-' : '+'}{fmt(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}

      </div>

      {/* ── Simple Upload Modal ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <form onSubmit={handleUpload} className="bg-paper border border-border-default rounded-xl shadow-2xl p-8 w-full max-w-md animate-in slide-in-from-bottom-8">
            <h2 className="font-display font-medium text-2xl mb-6 text-ink">Source Docs Extractor</h2>
            
            <div className="space-y-5 font-body">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-ink">Upload Export (.pdf or .csv)</label>
                <input name="file" type="file" accept=".pdf,.csv" required className="w-full border border-border-strong rounded-xl p-2.5 text-sm bg-paper-sunken outline-none focus:border-accent transition" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-ink">Target Month</label>
                  <input name="uploadMonth" type="month" required defaultValue={`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`} className="w-full border border-border-strong rounded-xl p-2 text-sm bg-paper outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-ink">Type</label>
                  <select name="statementType" className="w-full border border-border-strong rounded-xl p-2 text-sm bg-paper outline-none focus:border-accent">
                    <option value="bank_account">Bank Account</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-ink">Bank Name (For Origin Tracking)</label>
                <input name="bankName" type="text" placeholder="e.g. HDFC Bank / ICICI Amazon" required className="w-full border border-border-strong rounded-xl p-2 text-sm bg-paper outline-none focus:border-accent" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShowUploadModal(false)} className="px-5 py-2.5 rounded-xl hover:bg-paper-sunken text-sm font-medium text-ink transition-colors">Cancel</button>
              <button type="submit" disabled={isUploading} className="px-5 py-2.5 bg-teal-700 text-white rounded-xl text-sm font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors shadow-sm">
                {isUploading ? 'Parsing & Mapping...' : 'Upload & Compute'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Statement Upload Log History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-paper border border-border-default rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border-default flex items-center justify-between bg-paper-sunken">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent-soft0/10 rounded-lg border border-teal-500/20">
                  <History className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-xl text-ink">Statement Upload Log History</h2>
                  <p className="text-xs font-medium text-ink-soft">Explore logs of historical uploads, origin bank names, upload timestamps, and transaction counts.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Summary Cards */}
            <div className="p-6 border-b border-border-default bg-paper grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-paper-sunken border border-border-default rounded-lg p-3.5 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-soft uppercase">Total Statements</p>
                  <p className="text-lg font-bold text-ink">{uploads?.length || 0}</p>
                </div>
              </div>

              <div className="bg-paper-sunken border border-border-default rounded-lg p-3.5 flex items-center gap-3">
                <div className="p-2 bg-accent-soft0/10 rounded-xl text-accent">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-soft uppercase">Total Parsed Txns</p>
                  <p className="text-lg font-bold text-ink">
                    {(uploads || []).reduce((acc, u) => acc + (u.totalTransactions || 0), 0)}
                  </p>
                </div>
              </div>

              <div className="bg-paper-sunken border border-border-default rounded-lg p-3.5 flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-soft uppercase">Institutions Logged</p>
                  <p className="text-lg font-bold text-ink">
                    {new Set((uploads || []).map(u => u.bankName).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-3 border-b border-border-default bg-paper flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by bank name or file name..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-paper-sunken border border-border-strong rounded-xl outline-none focus:border-teal-600 text-ink"
                />
              </div>
              <span className="text-xs text-ink-soft font-mono">
                Showing {((uploads || []).filter(u => 
                  !historySearch || 
                  (u.bankName || '').toLowerCase().includes(historySearch.toLowerCase()) || 
                  (u.fileName || '').toLowerCase().includes(historySearch.toLowerCase())
                )).length} of {uploads?.length || 0} entries
              </span>
            </div>

            {/* Logs Table */}
            <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
              {(!uploads || uploads.length === 0) ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <History className="w-12 h-12 text-ink-soft/30 mb-3" />
                  <p className="text-sm font-semibold text-ink-soft">No statement upload logs found.</p>
                  <p className="text-xs text-ink-soft/70 mt-1">Upload a bank statement using the "Source Docs" button to start building your log history.</p>
                </div>
              ) : (
                <div className="border border-border-default rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-paper-sunken text-ink-soft font-semibold uppercase tracking-wider border-b border-border-default">
                      <tr>
                        <th className="px-4 py-3">Bank / Origin</th>
                        <th className="px-4 py-3">File & Type</th>
                        <th className="px-4 py-3">Target Month</th>
                        <th className="px-4 py-3">Uploaded At</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Transactions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default font-medium">
                      {(uploads || [])
                        .filter(u => 
                          !historySearch || 
                          (u.bankName || '').toLowerCase().includes(historySearch.toLowerCase()) || 
                          (u.fileName || '').toLowerCase().includes(historySearch.toLowerCase())
                        )
                        .map((upload) => {
                          const uploadDate = new Date(upload.uploadedAt);
                          const monthDate = upload.month ? new Date(upload.month) : null;
                          const monthFormatted = monthDate ? monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A';
                          
                          return (
                            <tr key={upload.id} className="hover:bg-paper-sunken/60 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-ink">{upload.bankName || 'Unknown Institution'}</span>
                                  <span className="text-[10px] text-ink-soft uppercase font-bold tracking-wider opacity-70">
                                    {(upload.statementType || 'bank_account').replace('_', ' ')}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate max-w-[180px] font-mono text-[11px] text-ink" title={upload.fileName}>
                                    {upload.fileName}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                    {upload.fileType || 'file'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-ink-soft">
                                {monthFormatted}
                              </td>
                              <td className="px-4 py-3 font-mono text-ink-soft">
                                <div className="flex flex-col">
                                  <span>{uploadDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="text-[10px] opacity-75">{uploadDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {upload.status === 'completed' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                                  </span>
                                )}
                                {upload.status === 'failed' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    <XCircle className="w-3 h-3 text-rose-600" /> Failed
                                  </span>
                                )}
                                {upload.status !== 'completed' && upload.status !== 'failed' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                    <Clock className="w-3 h-3 text-sky-600 animate-spin" /> {upload.status || 'Processing'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-ink">
                                {upload.totalTransactions ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-border-default bg-paper-sunken flex justify-between items-center text-xs text-ink-soft">
              <span>Logs are updated in real-time as statements are uploaded & parsed.</span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-paper hover:bg-paper-raised border border-border-strong rounded-xl font-medium text-ink transition-colors shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
