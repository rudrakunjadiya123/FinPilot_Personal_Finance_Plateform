import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import LoanSuggestionsWidget from '../components/LoanSuggestionsWidget';
import StatusPill from '../components/primitives/StatusPill';
import { formatCurrency, formatPercentage, calculateFinancialHealth } from '../utils/formatters';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, CreditCard, Calendar,
  PieChart, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  HandCoins, PiggyBank, Lightbulb, Activity, 
  AlertTriangle, ArrowRight, ShieldCheck, Clock,
  UtensilsCrossed, ShoppingBag, Home, Car, Zap, Film, Package
} from 'lucide-react';

export default function DashboardPage() {
  const { summaryData, isLoadingSummary } = useDashboardData();

  const now = new Date();
  const currentPeriodText = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

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

  // Financial health calculation
  const health = useMemo(() => {
    return calculateFinancialHealth(kpis, cashFlow);
  }, [kpis, cashFlow]);

  // Total categorized spending
  const totalCategories = spending.food + spending.shopping + spending.rent + 
    spending.transport + spending.utilities + spending.entertainment + spending.other;

  const otherPercentage = totalCategories > 0 ? Math.round((spending.other / totalCategories) * 100) : 0;

  // Primary 4 KPIs
  const isCashDeficit = kpis.availableCash < 0;
  const netCashFlowVal = kpis.monthlyIncome - kpis.monthlyExpense;

  const primaryKpis = [
    {
      label: 'Net Worth',
      value: kpis.netWorth,
      subtitle: 'Assets − Total Liabilities',
      trend: { direction: 'up', label: 'Calculated live', sentiment: 'neutral' },
      icon: TrendingUp,
      iconBg: 'bg-positive-soft',
      iconColor: 'text-positive',
    },
    {
      label: 'Monthly Cash Flow',
      value: netCashFlowVal,
      subtitle: netCashFlowVal >= 0 ? 'Net Monthly Surplus' : 'Net Monthly Deficit',
      trend: { 
        direction: netCashFlowVal >= 0 ? 'up' : 'down', 
        label: netCashFlowVal >= 0 ? 'Surplus' : 'Deficit',
        sentiment: netCashFlowVal >= 0 ? 'positive' : 'negative'
      },
      icon: netCashFlowVal >= 0 ? TrendingUp : TrendingDown,
      iconBg: netCashFlowVal >= 0 ? 'bg-positive-soft' : 'bg-negative-soft',
      iconColor: netCashFlowVal >= 0 ? 'text-positive' : 'text-negative',
    },
    {
      label: 'Total Debt',
      value: kpis.totalDebt,
      subtitle: 'Active Principal & Borrowed',
      trend: { direction: 'down', label: 'Active obligations', sentiment: 'neutral' },
      icon: CreditCard,
      iconBg: 'bg-negative-soft',
      iconColor: 'text-negative',
    },
    {
      label: isCashDeficit ? 'Cash Deficit' : 'Available Cash',
      value: kpis.availableCash,
      subtitle: isCashDeficit ? 'Obligations exceed income' : 'Unallocated liquidity',
      trend: { 
        direction: isCashDeficit ? 'down' : 'up', 
        label: isCashDeficit ? 'Deficit' : 'Surplus',
        sentiment: isCashDeficit ? 'negative' : 'positive'
      },
      icon: Wallet,
      iconBg: isCashDeficit ? 'bg-negative-soft' : 'bg-positive-soft',
      iconColor: isCashDeficit ? 'text-negative' : 'text-positive',
    },
  ];

  // Secondary 4 KPIs
  const savingsRateVal = kpis.monthlyIncome > 0 
    ? ((kpis.monthlyIncome - kpis.monthlyExpense) / kpis.monthlyIncome) * 100 
    : null;

  const secondaryKpis = [
    { label: 'Monthly Income', val: kpis.monthlyIncome, icon: PiggyBank, iconBg: 'bg-positive-soft', iconColor: 'text-positive', sub: 'Verified deposits' },
    { label: 'Monthly Expense', val: kpis.monthlyExpense, icon: TrendingDown, iconBg: 'bg-negative-soft', iconColor: 'text-negative', sub: 'Debits & outflows' },
    { label: 'Total EMI', val: kpis.totalEmi, icon: Calendar, iconBg: 'bg-info-soft', iconColor: 'text-info', sub: 'Active monthly debt' },
    { 
      label: 'Savings Rate', 
      isPct: true, 
      val: formatPercentage(savingsRateVal, { fallback: '—' }), 
      icon: ShieldCheck, 
      iconBg: 'bg-accent-soft',
      iconColor: 'text-accent-text',
      sub: kpis.monthlyIncome > 0 ? 'Of verified income' : 'No income recorded' 
    },
  ];

  // Spending categories list mapped strictly to WCAG semantic pairs
  const spendingCategories = [
    { label: 'Food', amount: spending.food, color: 'var(--color-negative-val, #B91C1C)', iconBg: 'bg-negative-soft', iconColor: 'text-negative', icon: UtensilsCrossed },
    { label: 'Shopping', amount: spending.shopping, color: 'var(--color-purple-val, #6D28D9)', iconBg: 'bg-purple-soft', iconColor: 'text-purple', icon: ShoppingBag },
    { label: 'Rent', amount: spending.rent, color: 'var(--color-neutral-val, #3F3F46)', iconBg: 'bg-neutral-soft', iconColor: 'text-neutral', icon: Home },
    { label: 'Transport', amount: spending.transport, color: 'var(--color-negative-val, #B91C1C)', iconBg: 'bg-negative-soft', iconColor: 'text-negative', icon: Car },
    { label: 'Utilities', amount: spending.utilities, color: 'var(--color-info-val, #1D4ED8)', iconBg: 'bg-info-soft', iconColor: 'text-info', icon: Zap },
    { label: 'Entertainment', amount: spending.entertainment, color: 'var(--color-purple-val, #6D28D9)', iconBg: 'bg-purple-soft', iconColor: 'text-purple', icon: Film },
    { label: 'Other', amount: spending.other, color: 'var(--color-neutral-val, #3F3F46)', iconBg: 'bg-neutral-soft', iconColor: 'text-neutral', icon: Package },
  ];

  // Action required items (Section 3.8)
  const actionItems = [];
  if (isCashDeficit) {
    actionItems.push({
      id: 'deficit',
      severity: 'negative',
      title: 'Monthly Cash Deficit Detected',
      desc: `Your current monthly obligations exceed verified income by ${formatCurrency(Math.abs(kpis.availableCash))}.`,
      actionText: 'Review Income & Expenses',
      link: '/app/income'
    });
  }
  if (otherPercentage >= 40 && spending.other > 0) {
    actionItems.push({
      id: 'other-spending',
      severity: 'warning',
      title: 'High Uncategorized Spending',
      desc: `${otherPercentage}% of your outflows are marked as "Other". Categorize transactions to sharpen AI forecasts.`,
      actionText: 'Review Transactions',
      link: '/app/statements'
    });
  }
  if (kpis.totalEmi > 0) {
    actionItems.push({
      id: 'upcoming-emi',
      severity: 'info',
      title: 'Scheduled Loan Obligations',
      desc: `Total monthly EMI of ${formatCurrency(kpis.totalEmi)} scheduled for repayment this cycle.`,
      actionText: 'View Schedule',
      link: '/app/loans'
    });
  }

  if (isLoadingSummary) {
    return (
      <div className="p-12 text-ink-soft flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading your financial command center...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 pb-20 font-body">
      
      {/* ── Page Header & Period Indicator ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper-raised border border-border-default rounded-2xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-ink tracking-tight">Financial Dashboard</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent border border-accent/20">
              Live
            </span>
          </div>
          <p className="text-xs text-ink-soft mt-1">
            Current accounting period: <span className="font-semibold text-ink">{currentPeriodText}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link 
            to="/app/income" 
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-border-default hover:border-border-strong text-ink bg-paper-raised hover:bg-paper-sunken transition-all duration-150"
          >
            + Add Income
          </Link>
          <Link 
            to="/app/loans" 
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-accent hover:bg-accent-hover text-white shadow-sm transition-all duration-150 flex items-center gap-1.5"
          >
            Manage Debt <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Pending Loan Suggestions from Statements */}
      <LoanSuggestionsWidget />

      {/* ── Action Required Section (Section 3.8) ── */}
      {actionItems.length > 0 && (
        <div className="bg-paper-raised border border-border-default rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h2 className="font-display font-bold text-base text-ink">Action Required</h2>
            </div>
            <span className="text-[11px] font-medium text-ink-soft">{actionItems.length} items need attention</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {actionItems.map((item) => {
              const borderTheme = item.severity === 'negative'
                ? 'border-negative/30 bg-negative-soft/30'
                : item.severity === 'warning'
                ? 'border-warning/30 bg-warning-soft/30'
                : 'border-info/30 bg-info-soft/30';

              const badgeColor = item.severity === 'negative'
                ? 'bg-negative-soft text-negative'
                : item.severity === 'warning'
                ? 'bg-warning-soft text-warning'
                : 'bg-info-soft text-info';

              return (
                <div key={item.id} className={`p-4 rounded-xl border ${borderTheme} flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-xs text-ink">{item.title}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-soft leading-relaxed">{item.desc}</p>
                  </div>
                  <Link 
                    to={item.link} 
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 1. Primary 4-Card KPI Row (Section 3.1) ── */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryKpis.map((card, idx) => {
            const isNeg = Number(card.value) < 0;
            return (
              <div 
                key={idx} 
                className="bg-paper-raised border border-border-default rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-ink-soft">{card.label}</span>
                  <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>

                <div className="my-2">
                  <div className={`text-2xl font-mono font-bold tracking-tight ${isNeg ? 'text-negative' : 'text-ink'}`}>
                    {formatCurrency(card.value)}
                  </div>
                  <span className="text-[11px] text-ink-faint mt-0.5 block">{card.subtitle}</span>
                </div>

                <div className="pt-2 border-t border-border-default/60 flex items-center justify-between text-[11px]">
                  <span className={`inline-flex items-center gap-1 font-medium ${
                    card.trend.sentiment === 'positive' ? 'text-positive' : card.trend.sentiment === 'negative' ? 'text-negative' : 'text-ink-soft'
                  }`}>
                    {card.trend.direction === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {card.trend.label}
                  </span>
                  <span className="text-ink-faint font-mono text-[10px]">{currentPeriodText.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary 4-Card Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {secondaryKpis.map((sec, idx) => (
            <div key={idx} className="bg-paper-sunken border border-border-default rounded-xl p-3.5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${sec.iconBg} flex items-center justify-center shrink-0`}>
                <sec.icon className={`w-4 h-4 ${sec.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-ink-soft block truncate">{sec.label}</span>
                <span className="text-base font-mono font-bold text-ink block">
                  {sec.isPct ? sec.val : formatCurrency(sec.val)}
                </span>
                <span className="text-[10px] text-ink-faint block truncate">{sec.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Financial Health Summary (Section 3.2) ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <h2 className="font-display font-bold text-lg text-ink">Financial Health Index</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${health.badgeColor}`}>
                {health.rating}
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              {health.summary}
            </p>
          </div>

          <div className="flex items-baseline gap-1.5 shrink-0 bg-paper-sunken px-4 py-2 rounded-xl border border-border-default">
            <span className="text-3xl font-mono font-bold text-ink">{health.score}</span>
            <span className="text-xs font-mono text-ink-faint">/ 100</span>
          </div>
        </div>

        {/* Score Progress Bar */}
        <div className="w-full h-2.5 bg-paper-sunken rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              health.score >= 80 ? 'bg-positive' : health.score >= 60 ? 'bg-info' : 'bg-warning'
            }`}
            style={{ width: `${health.score}%` }} 
          />
        </div>

        {/* Diagnostic Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-paper-sunken p-3 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Cash Flow State</span>
            <span className="text-sm font-semibold text-ink mt-0.5 block">{health.metrics.cashFlowRating}</span>
            <span className="text-[10px] text-ink-soft">Income vs fixed outflows</span>
          </div>
          <div className="bg-paper-sunken p-3 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Debt Burden Ratio</span>
            <span className="text-sm font-semibold text-ink mt-0.5 block">{health.metrics.debtBurden}</span>
            <span className="text-[10px] text-ink-soft">Monthly EMI over income</span>
          </div>
          <div className="bg-paper-sunken p-3 rounded-xl border border-border-default">
            <span className="text-[10px] font-semibold text-ink-faint uppercase block">Liquidity Cushion</span>
            <span className="text-sm font-semibold text-ink mt-0.5 block">{health.metrics.liquidityBuffer}</span>
            <span className="text-[10px] text-ink-soft">Months of expense coverage</span>
          </div>
        </div>
      </div>

      {/* ── 3. Cash Flow Overview (Section 3.3 — No Infinity%!) ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-ink tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Cash Flow Breakdown
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">Verified inflows against recurring debts and expenses</p>
          </div>
          <span className="text-[11px] font-medium text-ink-soft">
            Period: {currentPeriodText}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left: Financial Figures & Safe Percentage Bars */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-paper-sunken p-3.5 rounded-xl border border-border-default">
                <span className="text-[10px] font-semibold text-positive uppercase block">Income</span>
                <span className="text-base sm:text-lg font-mono font-bold text-ink block mt-1">
                  {formatCurrency(cashFlow.income)}
                </span>
              </div>
              <div className="bg-paper-sunken p-3.5 rounded-xl border border-border-default">
                <span className="text-[10px] font-semibold text-negative uppercase block">Expenses</span>
                <span className="text-base sm:text-lg font-mono font-bold text-ink block mt-1">
                  {formatCurrency(cashFlow.expenses)}
                </span>
              </div>
              <div className="bg-paper-sunken p-3.5 rounded-xl border border-border-default">
                <span className="text-[10px] font-semibold text-accent uppercase block">
                  {cashFlow.savings >= 0 ? 'Surplus' : 'Deficit'}
                </span>
                <span className={`text-base sm:text-lg font-mono font-bold block mt-1 ${cashFlow.savings < 0 ? 'text-negative' : 'text-ink'}`}>
                  {formatCurrency(cashFlow.savings)}
                </span>
              </div>
            </div>

            {/* Safe Percentage Bars (No Infinity when income is 0) */}
            <div className="space-y-3 pt-2">
              {(() => {
                const inc = cashFlow.income;
                const expPct = inc > 0 ? Math.min(100, Math.round((cashFlow.expenses / inc) * 100)) : 0;
                const savPct = inc > 0 ? Math.max(0, Math.min(100, Math.round((cashFlow.savings / inc) * 100))) : 0;

                return (
                  <>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-ink mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-positive" />
                          Income Realized
                        </span>
                        <span className="font-mono text-ink-soft">
                          {inc > 0 ? '100%' : 'No deposits this cycle'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-paper-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-positive rounded-full transition-all duration-500" style={{ width: inc > 0 ? '100%' : '0%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium text-ink mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-warning" />
                          Expense Ratio
                        </span>
                        <span className="font-mono text-ink-soft">
                          {inc > 0 ? `${expPct}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-paper-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-warning rounded-full transition-all duration-500" style={{ width: `${expPct}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium text-ink mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          Net Savings Rate
                        </span>
                        <span className="font-mono text-ink-soft">
                          {inc > 0 ? `${savPct}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-paper-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${savPct}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right: Cash Flow History Chart */}
          <div className="bg-paper-sunken border border-border-default rounded-2xl p-4 h-[250px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-soft">Monthly Savings History</span>
              <span className="text-[10px] text-ink-faint">Last 4 Months</span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow.history || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line-val, #E5E7EB)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-ink-soft-val, #6B7280)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-ink-faint-val, #9CA3AF)' }} tickFormatter={(v) => `₹${Math.round(v / 1000)}K`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--color-paper-raised-val, #FFFFFF)', 
                      border: '1px solid var(--color-line-val, #E5E7EB)', 
                      borderRadius: '12px', 
                      boxShadow: 'var(--shadow-elevated)', 
                      fontSize: '12px' 
                    }}
                    formatter={(value) => [formatCurrency(value), 'Net Surplus']}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {(cashFlow.history || []).map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === (cashFlow.history?.length - 1) ? 'var(--color-accent-val, #F7931A)' : 'var(--color-accent-hover-val, #FF9F33)'} 
                        opacity={index === (cashFlow.history?.length - 1) ? 1 : 0.65} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Spending Analysis & Lend/Borrow Grid (Sections 3.4 & 3.5) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Spending Analysis with High-Other Warning */}
        <div className="lg:col-span-2 bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <PieChart className="w-4 h-4 text-accent" />
                Spending by Category
              </h3>
              <p className="text-xs text-ink-faint mt-0.5">Aggregated from categorized bank debits</p>
            </div>
            <Link to="/app/statements" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1">
              <span>View Statements</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* High Other Category Alert (Section 3.4) */}
          {otherPercentage >= 40 && spending.other > 0 && (
            <div className="p-3.5 rounded-xl bg-warning-soft border border-warning/20 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-semibold text-ink block">
                  {otherPercentage}% of spending is categorized as "Other"
                </span>
                <span className="text-ink-soft mt-0.5 block leading-relaxed">
                  Reviewing these transactions will significantly improve your AI cash flow predictions and budgeting models.
                </span>
              </div>
              <Link 
                to="/app/statements" 
                className="px-2.5 py-1 text-[11px] font-semibold bg-warning hover:opacity-90 text-white rounded-lg shrink-0 shadow-sm transition-opacity"
              >
                Review
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {spendingCategories.map((item, idx) => {
              const pct = totalCategories > 0 ? Math.round((item.amount / totalCategories) * 100) : 0;
              return (
                <div key={idx} className="bg-paper-sunken p-4 rounded-xl border border-border-default hover:border-border-strong transition-all duration-150">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-xs text-ink-soft block truncate">{item.label}</span>
                      <span className="font-mono text-xs font-bold text-ink truncate block">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-[10px] text-ink-faint font-mono mt-1 block">{pct}% of spend</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lend & Borrow Summary (Section 3.5) */}
        <div className="lg:col-span-1 bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-accent" />
                Lend & Borrow
              </h3>
              <Link to="/app/lend-borrow" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-ink-faint">Peer lending and borrowing position</p>

            <div className="space-y-3 mt-4">
              <div className="bg-paper-sunken border border-border-default rounded-xl p-4">
                <span className="text-[10px] font-semibold text-ink-faint uppercase block">Total Lent Out</span>
                <div className="text-xl font-mono font-bold text-ink mt-0.5">{formatCurrency(spending.moneyLent)}</div>
                <div className="flex justify-between text-xs pt-2 mt-2 border-t border-border-default font-mono">
                  <span className="text-ink-soft">To Receive:</span>
                  <span className="font-bold text-positive">{formatCurrency(spending.toReceive)}</span>
                </div>
              </div>

              <div className="bg-paper-sunken border border-border-default rounded-xl p-4">
                <span className="text-[10px] font-semibold text-ink-faint uppercase block">Total Borrowed</span>
                <div className="text-xl font-mono font-bold text-ink mt-0.5">{formatCurrency(spending.moneyBorrowed)}</div>
                <div className="flex justify-between text-xs pt-2 mt-2 border-t border-border-default font-mono">
                  <span className="text-ink-soft">To Pay Back:</span>
                  <span className="font-bold text-negative">{formatCurrency(spending.toPay)}</span>
                </div>
              </div>
            </div>
          </div>

          <Link 
            to="/app/lend-borrow" 
            className="w-full py-2.5 rounded-xl border border-border-default hover:bg-paper-sunken text-xs font-medium text-ink text-center transition-colors block"
          >
            Manage Peer Loans
          </Link>
        </div>
      </div>

      {/* ── 5. Goals & AI Brief Grid (Sections 3.6 & 3.7) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Financial Goals */}
        <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Financial Goals
            </h3>
            <Link to="/app/goals" className="text-xs font-medium text-accent hover:text-accent-hover flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8 text-ink-faint text-xs">
              No financial goals configured yet. Set a target in the Goals module.
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id} className="bg-paper-sunken border border-border-default rounded-xl p-4 flex items-center gap-4 hover:border-border-strong transition-all">
                  <div className="w-12 h-12 rounded-xl bg-paper-raised border border-border-default flex items-center justify-center text-xl shrink-0">
                    {g.icon || '🎯'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-ink truncate">{g.name}</span>
                      <StatusPill status={g.status === 'On Track' ? 'on_track' : 'at_risk'} label={g.status} size="xs" />
                    </div>
                    <div className="text-xs font-mono text-ink-soft mt-1">
                      {formatCurrency(g.currentSaved)} / {formatCurrency(g.targetAmount)} ({g.percentage}%)
                    </div>
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          g.percentage >= 75 ? 'bg-positive' : g.percentage >= 40 ? 'bg-accent' : 'bg-warning'
                        }`} 
                        style={{ width: `${Math.min(100, g.percentage)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Financial Brief (Section 3.7) */}
        <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              AI Financial Brief
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              Copilot Active
            </span>
          </div>

          <div className="space-y-3">
            {aiInsights.length === 0 ? (
              <div className="text-xs text-ink-faint py-6 text-center">
                Generating personalized insights from your latest cash flow data...
              </div>
            ) : (
              aiInsights.map((insight, idx) => (
                <div key={idx} className="bg-paper-sunken border border-border-default rounded-xl p-4 flex gap-3 items-start hover:border-purple-300 dark:hover:border-purple-800 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink leading-relaxed">{insight}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <Link to="/app/chat" className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                        <span>Ask Copilot about this</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── 6. Upcoming Financial Events (Section 3.9) ── */}
      <div className="bg-paper-raised border border-border-default rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-base text-ink">Upcoming Financial Events</h3>
          </div>
          <span className="text-[11px] font-medium text-ink-soft">Next 30 Days</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-paper-raised flex items-center justify-center text-accent shrink-0 border border-border-default">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-ink block">Next EMI Due Date</span>
              <span className="text-[11px] text-ink-soft mt-0.5 block">Estimated within cycle</span>
              <span className="text-xs font-mono font-bold text-ink mt-1 block">
                {kpis.totalEmi > 0 ? formatCurrency(kpis.totalEmi) : 'No active EMI'}
              </span>
            </div>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-paper-raised flex items-center justify-center text-positive shrink-0 border border-border-default">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-ink block">Expected Peer Receivable</span>
              <span className="text-[11px] text-ink-soft mt-0.5 block">From active lent records</span>
              <span className="text-xs font-mono font-bold text-positive mt-1 block">
                {formatCurrency(spending.toReceive)}
              </span>
            </div>
          </div>

          <div className="bg-paper-sunken p-4 rounded-xl border border-border-default flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-paper-raised flex items-center justify-center text-info shrink-0 border border-border-default">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-ink block">Goal Allocation Target</span>
              <span className="text-[11px] text-ink-soft mt-0.5 block">{goals.length} goals in tracking</span>
              <Link to="/app/goals" className="text-xs font-medium text-accent hover:underline mt-1 block">
                View contribution targets →
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
