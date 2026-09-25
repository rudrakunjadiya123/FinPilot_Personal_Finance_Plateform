/**
 * FINPILOT — Unified Financial & Date Formatting Utilities
 * Adheres to Section 2.1, 2.7, 2.8, 2.9 of FinPilot UI/UX Master Prompt
 */

/**
 * Formats numbers into Indian Currency representation (e.g., ₹1,00,000).
 * Accurately handles negative numbers: "-₹8,698" instead of "₹-8,698".
 * Avoids unnecessary decimals for whole figures unless requested.
 */
export function formatCurrency(amount, { showDecimals = false, compact = false, fallback = '₹0' } = {}) {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return fallback;
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (compact) {
    if (absNum >= 10000000) {
      const cr = (absNum / 10000000).toFixed(1).replace(/\.0$/, '');
      return `${isNegative ? '-' : ''}₹${cr}Cr`;
    }
    if (absNum >= 100000) {
      const lakh = (absNum / 100000).toFixed(1).replace(/\.0$/, '');
      return `${isNegative ? '-' : ''}₹${lakh}L`;
    }
    if (absNum >= 1000) {
      const k = (absNum / 1000).toFixed(1).replace(/\.0$/, '');
      return `${isNegative ? '-' : ''}₹${k}K`;
    }
  }

  const formattedAbs = showDecimals
    ? absNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(absNum).toLocaleString('en-IN');

  return `${isNegative ? '-' : ''}₹${formattedAbs}`;
}

/**
 * Formats percentages safely. Never outputs Infinity% or -Infinity%.
 * Returns fallback (default "—") when denominator is zero or value is non-finite.
 */
export function formatPercentage(value, { fallback = '—', decimals = 0 } = {}) {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  const num = Number(value);
  const formatted = decimals > 0 ? num.toFixed(decimals) : Math.round(num);
  return `${formatted}%`;
}

/**
 * Standardized Date Formatting across modules (e.g., "12 Aug 2026", "Aug 2026")
 */
export function formatDate(dateString, { format = 'medium' } = {}) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';

    if (format === 'short') {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
    if (format === 'monthYear') {
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    }
    if (format === 'fullMonth') {
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Computes a standardized financial health score (0-100) and factors
 * Used across Dashboard and other views for data consistency.
 */
export function calculateFinancialHealth(kpis = {}, cashFlow = {}) {
  const income = Number(kpis.monthlyIncome || cashFlow.income || 0);
  const expenses = Number(kpis.monthlyExpense || cashFlow.expenses || 0);
  const totalDebt = Number(kpis.totalDebt || 0);
  const totalEmi = Number(kpis.totalEmi || 0);
  const availableCash = Number(kpis.availableCash || 0);

  let score = 50; // Neutral baseline

  // 1. Savings / Cash Flow margin (up to +20 or -20)
  if (income > 0) {
    const savingsRate = (income - expenses) / income;
    if (savingsRate >= 0.3) score += 20;
    else if (savingsRate >= 0.15) score += 12;
    else if (savingsRate >= 0.05) score += 5;
    else if (savingsRate < 0) score -= 15;
  } else if (expenses > 0) {
    score -= 15;
  }

  // 2. Debt-to-Income / DTI ratio (up to +15 or -15)
  if (income > 0 && totalEmi > 0) {
    const dti = totalEmi / income;
    if (dti <= 0.2) score += 15;
    else if (dti <= 0.4) score += 5;
    else if (dti > 0.5) score -= 15;
  } else if (totalDebt === 0) {
    score += 15; // Debt-free bonus
  }

  // 3. Liquidity buffer (up to +15 or -10)
  if (expenses > 0) {
    const emergencyMonths = availableCash / expenses;
    if (emergencyMonths >= 6) score += 15;
    else if (emergencyMonths >= 3) score += 10;
    else if (emergencyMonths >= 1) score += 5;
    else if (availableCash <= 0) score -= 10;
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  let rating = 'Fair';
  let badgeColor = 'text-warning bg-warning-soft';
  let summary = 'Your cash flow is stable, but maintaining a higher savings buffer will improve resilience.';

  if (finalScore >= 80) {
    rating = 'Excellent';
    badgeColor = 'text-positive bg-positive-soft';
    summary = 'Strong savings margin with low debt exposure. You are in excellent financial health.';
  } else if (finalScore >= 65) {
    rating = 'Good';
    badgeColor = 'text-info bg-info-soft';
    summary = 'Healthy cash flow balance with manageable debt obligations. Keep building savings.';
  } else if (finalScore < 50) {
    rating = 'Needs Attention';
    badgeColor = 'text-negative bg-negative-soft';
    summary = 'Monthly debt or expenses exceed income target. Review high-interest obligations and cash deficit.';
  }

  return {
    score: finalScore,
    rating,
    badgeColor,
    summary,
    metrics: {
      cashFlowRating: income > expenses ? 'Positive' : 'Deficit',
      debtBurden: income > 0 && totalEmi > 0 ? `${Math.round((totalEmi / income) * 100)}% DTI` : 'Low',
      liquidityBuffer: expenses > 0 ? `${(Math.max(0, availableCash) / expenses).toFixed(1)} mo` : '—'
    }
  };
}
