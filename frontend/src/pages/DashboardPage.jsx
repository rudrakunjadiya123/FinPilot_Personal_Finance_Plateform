import React from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import LoanSuggestionsWidget from '../components/LoanSuggestionsWidget';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, CreditCard, Calendar,
  PieChart, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  HandCoins, PiggyBank, Lightbulb, Activity, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const { summaryData, isLoadingSummary } = useDashboardData();

  if (isLoadingSummary) {
    return (
      <div className="p-8 text-ink-soft flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        <span>Loading your financial dashboard...</span>
      </div>
    );
  }

  const kpis = summaryData?.kpis || {
    netWorth: 0, netWorthTrend: 0,
    monthlyIncome: 0, monthlyExpense: 0,
    monthlyExpenseTrend: 0, totalDebt: 0,
    availableCash: 0, totalEmi: 0,
  };

  const cashFlow = summaryData?.cashFlowBreakdown || {
    income: 0, expenses: 0, savings: 0,
    history: [],
  };

  const spending = summaryData?.spendingAnalysis || {
    food: 0, shopping: 0, rent: 0, transport: 0,
    utilities: 0, entertainment: 0, other: 0,
    moneyLent: 0, toReceive: 0, moneyBorrowed: 0, toPay: 0,
  };

  const goals = summaryData?.goals || [];

  const aiInsights = summaryData?.aiInsights || [];

  const totalCategories = spending.food + spending.shopping + spending.rent + spending.transport + spending.utilities + spending.entertainment + spending.other;

  const kpiCards = [
    { label: 'Net Worth', value: kpis.netWorth, icon: TrendingUp, trend: `↑ ${kpis.netWorthTrend}%`, trendUp: true, iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700 dark:text-emerald-400', trendColor: 'text-emerald-600' },
    { label: 'Monthly Income', value: kpis.monthlyIncome, icon: PiggyBank, trend: 'Verified', trendUp: true, iconBg: 'bg-green-50 dark:bg-green-950/40', iconColor: 'text-green-600', valueColor: 'text-green-700 dark:text-green-400', trendColor: 'text-green-600' },
    { label: 'Monthly Expense', value: kpis.monthlyExpense, icon: TrendingDown, trend: `↓ ${Math.abs(kpis.monthlyExpenseTrend)}%`, trendUp: false, iconBg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-500', valueColor: 'text-red-600 dark:text-red-400', trendColor: 'text-red-500' },
    { label: 'Total Debt', value: kpis.totalDebt, icon: CreditCard, trend: 'Liabilities', trendUp: false, iconBg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500', valueColor: 'text-rose-600 dark:text-rose-400', trendColor: 'text-rose-500' },
    { label: 'Available Cash', value: kpis.availableCash, icon: Wallet, trend: 'Surplus', trendUp: true, iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-600', valueColor: 'text-blue-700 dark:text-blue-400', trendColor: 'text-blue-600' },
    { label: 'Total EMI', value: kpis.totalEmi, icon: Calendar, trend: '/ month', trendUp: false, iconBg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500', valueColor: 'text-orange-600 dark:text-orange-400', trendColor: 'text-orange-500' },
  ];

  const spendingCategories = [
    { label: 'Food', amount: spending.food, color: '#EF4444', iconBg: 'bg-red-50 dark:bg-red-950/40', emoji: '🍔' },
    { label: 'Shopping', amount: spending.shopping, color: '#6366F1', iconBg: 'bg-indigo-50 dark:bg-indigo-950/40', emoji: '🛍️' },
    { label: 'Rent', amount: spending.rent, color: '#EC4899', iconBg: 'bg-pink-50 dark:bg-pink-950/40', emoji: '🏠' },
    { label: 'Transport', amount: spending.transport, color: '#3B82F6', iconBg: 'bg-blue-50 dark:bg-blue-950/40', emoji: '🚗' },
    { label: 'Utilities', amount: spending.utilities, color: '#8B5CF6', iconBg: 'bg-violet-50 dark:bg-violet-950/40', emoji: '⚡' },
    { label: 'Entertainment', amount: spending.entertainment, color: '#F59E0B', iconBg: 'bg-amber-50 dark:bg-amber-950/40', emoji: '🎬' },
    { label: 'Other', amount: spending.other, color: '#94A3B8', iconBg: 'bg-slate-50 dark:bg-slate-800/40', emoji: '📦' },
  ];

  return (
    <div className="flex flex-col space-y-6 pb-16 font-body">
      
      {/* Pending Loan Suggestions */}
      <LoanSuggestionsWidget />

      {/* ── 1. KPI Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, idx) => (
          <div 
            key={idx} 
            className="bg-paper-raised border border-border-default rounded-xl p-4 shadow-card card-hover flex flex-col justify-between h-[140px] relative overflow-hidden group animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <div>
              <div className={`text-xl font-mono font-bold tracking-tight ${card.valueColor}`}>₹{Number(card.value).toLocaleString("en-IN")}</div>
              <div className={`flex items-center gap-1 text-[11px] font-semibold mt-1 ${card.trendColor}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Cash Flow Section ── */}
      <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-ink tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Cash Flow Overview
            </h2>
            <p className="text-xs text-ink-faint mt-0.5">Monthly income, expenses & savings</p>
          </div>
          <span className="text-[10px] font-semibold bg-accent-soft text-accent px-3 py-1 rounded-full uppercase tracking-wider">
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left: Figures & Progress */}
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Income', val: cashFlow.income, color: 'bg-green-50 text-green-600' },
                { label: 'Expenses', val: cashFlow.expenses, color: 'bg-red-50 text-red-500' },
                { label: 'Savings', val: cashFlow.savings, color: 'bg-blue-50 text-blue-600' },
              ].map((item, i) => (
                <div key={i} className="bg-paper-sunken p-3 rounded-lg border border-border-default">
                  <span className={`inline-flex mb-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${item.color}`}>{item.label}</span>
                  <span className="text-lg font-mono font-bold text-ink block">₹{Number(item.val).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              {[
                { label: 'Income', pct: 100, val: cashFlow.income, color: 'bg-positive' },
                { label: 'Expenses', pct: Math.round((cashFlow.expenses / cashFlow.income) * 100), val: cashFlow.expenses, color: 'bg-warning' },
                { label: 'Savings', pct: Math.round((cashFlow.savings / cashFlow.income) * 100), val: cashFlow.savings, color: 'bg-accent' },
              ].map((bar, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] font-semibold text-ink mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${bar.color}`} />
                      {bar.label}
                    </span>
                    <span className="font-mono text-ink-soft">{bar.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-paper-sunken rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, bar.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chart */}
          <div className="bg-paper-sunken border border-border-default rounded-xl p-4 h-[240px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">Monthly History</span>
            </div>
            <div className="h-[195px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow.history} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-faint)' }} tickFormatter={(v) => `₹${v / 1000}K`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-border-default)', borderRadius: '10px', boxShadow: 'var(--shadow-elevated)', fontSize: '12px' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, 'Savings']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {cashFlow.history.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === cashFlow.history.length - 1 ? 'var(--color-accent)' : 'var(--color-accent-hover)'} opacity={index === cashFlow.history.length - 1 ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Spending & Lend/Borrow Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spending Analysis */}
        <div className="lg:col-span-2 bg-paper-raised border border-border-default rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <PieChart className="w-4 h-4 text-accent" />
              Spending Analysis
            </h3>
            <span className="text-[10px] text-ink-faint font-mono uppercase">Categorized</span>
          </div>


          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {spendingCategories.map((item, idx) => {
              const pct = totalCategories > 0 ? Math.round((item.amount / totalCategories) * 100) : 0;
              return (
                <div key={idx} className="bg-paper-sunken p-4 rounded-xl border border-border-default hover:border-border-strong transition-all duration-150 card-hover">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center text-lg`}>
                      {item.emoji}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-ink-soft block">{item.label}</span>
                      <span className="font-mono text-sm font-bold text-ink">₹{Number(item.amount).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-[10px] text-ink-faint font-mono mt-1 block">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lend & Borrow */}
        <div className="lg:col-span-1 bg-paper-raised border border-border-default rounded-xl p-6 shadow-card space-y-4 flex flex-col">
          <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-accent" />
            Lend & Borrow
          </h3>

          <div className="space-y-3 flex-1">
            <div className="bg-accent-soft border border-accent/20 rounded-lg p-4 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Money Lent Out</span>
              <div className="text-xl font-mono font-bold text-accent">₹{Number(spending.moneyLent).toLocaleString("en-IN")}</div>
              <div className="flex justify-between text-[11px] pt-1.5 border-t border-accent/10 font-mono">
                <span className="text-ink-soft">To Receive:</span>
                <span className="font-bold text-accent">₹{Number(spending.toReceive).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="bg-warning-soft border border-warning/20 rounded-lg p-4 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-warning">Money Borrowed</span>
              <div className="text-xl font-mono font-bold text-warning">₹{Number(spending.moneyBorrowed).toLocaleString("en-IN")}</div>
              <div className="flex justify-between text-[11px] pt-1.5 border-t border-warning/10 font-mono">
                <span className="text-ink-soft">To Pay:</span>
                <span className="font-bold text-negative">₹{Number(spending.toPay).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Goals & AI Insights Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Goals */}
        <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card space-y-4">
          <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Financial Goals
          </h3>

          <div className="space-y-3">
            {goals.map((g) => {
              const circumference = 2 * Math.PI * 20;
              const offset = circumference - (g.percentage / 100) * circumference;
              return (
                <div key={g.id} className="bg-paper-sunken border border-border-default rounded-lg p-4 flex items-center gap-4 hover:border-accent/30 transition-colors duration-150">
                  {/* Mini circular progress */}
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-border-default)" strokeWidth="3" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke={g.statusColor === 'emerald' ? '#22c55e' : '#f59e0b'} strokeWidth="3" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-ink">{g.percentage}%</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-ink flex items-center gap-1.5">
                        <span className="text-base">{g.icon}</span> {g.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.statusColor === 'emerald' ? 'bg-green-50 dark:bg-green-950/40 text-green-600' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                      }`}>
                        {g.statusColor === 'emerald' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {g.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-ink-soft mt-0.5">
                      ₹{(g.currentSaved / 100000).toFixed(1)}L / ₹{(g.targetAmount / 100000).toFixed(1)}L
                    </div>
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${g.statusColor === 'emerald' ? 'bg-positive' : 'bg-warning'}`} style={{ width: `${g.percentage}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-paper-raised border border-border-default rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              AI Insights
            </h3>
            <span className="text-[10px] font-semibold bg-accent-soft text-accent px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="space-y-2.5">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="bg-paper-sunken border border-border-default rounded-lg p-3.5 flex gap-3 items-start hover:border-accent/30 transition-colors duration-150 group/insight">
                <div className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center shrink-0 mt-0.5 group-hover/insight:bg-accent group-hover/insight:text-white transition-colors duration-200">
                  <Lightbulb className="w-3.5 h-3.5 text-accent group-hover/insight:text-white" />
                </div>
                <p className="text-xs text-ink leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
