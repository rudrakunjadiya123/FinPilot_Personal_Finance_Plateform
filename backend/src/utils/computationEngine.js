// ═══════════════════════════════════════════════════════════
// FINPILOT — Computation Engine
// Deterministic financial math (Plain JS, zero AI involvement)
// ═══════════════════════════════════════════════════════════

/**
 * Calculates the Equated Monthly Installment (EMI).
 * @param {number} principal - Loan principal amount
 * @param {number} annualInterestRate - Annual interest rate in percentage
 * @param {number} tenureMonths - Total number of months
 * @returns {number} EMI amount
 */
function calculateEMI(principal, annualInterestRate, tenureMonths) {
  if (annualInterestRate === 0) return principal / tenureMonths;

  const r = annualInterestRate / 12 / 100;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return emi;
}

/**
 * Generates an amortization schedule for a given loan.
 * @param {number} principal - Starting principal balance
 * @param {number} annualInterestRate - Annual interest rate in percentage
 * @param {number} tenureMonths - Total number of months
 * @param {number} emiAmount - The exact monthly payment amount
 * @param {Date} startDate - When the loan begins
 * @returns {Array} Array of schedule objects
 */
function generateAmortizationSchedule(
  principal,
  annualInterestRate,
  tenureMonths,
  emiAmount,
  startDate
) {
  const schedule = [];
  let remainingBalance = principal;
  const r = annualInterestRate / 12 / 100;

  for (let i = 1; i <= tenureMonths; i++) {
    // Determine the due date for this specific month
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    let interestComponent = remainingBalance * r;
    let principalComponent = emiAmount - interestComponent;

    // Handle the final month to avoid tiny floating point remainders
    if (i === tenureMonths || remainingBalance - principalComponent <= 0) {
      principalComponent = remainingBalance;
      emiAmount = principalComponent + interestComponent;
      remainingBalance = 0;
    } else {
      remainingBalance -= principalComponent;
    }

    schedule.push({
      month: i,
      dueDate: dueDate,
      principalComponent: parseFloat(principalComponent.toFixed(2)),
      interestComponent: parseFloat(interestComponent.toFixed(2)),
      balanceAfter: parseFloat(remainingBalance.toFixed(2)),
    });

    if (remainingBalance <= 0) break;
  }

  return schedule;
}

/**
 * Simulates the effect of a lump-sum prepayment on a loan's remaining schedule.
 * @param {number} prepaymentAmount - The amount being prepaid
 * @param {number} currentBalance - The current outstanding balance
 * @param {number} emiAmount - The existing EMI amount
 * @param {number} annualInterestRate - Annual interest rate in percentage
 * @param {Array} originalRemainingSchedule - The previously computed schedule going forward
 * @param {string} [strategy='tenure'] - Optimization strategy ('tenure' to reduce tenure, 'emi' to lower monthly EMI)
 * @returns {Object} Simulation results including interest saved, new tenure, and new EMI
 */
function simulatePrepayment(
  prepaymentAmount,
  currentBalance,
  emiAmount,
  annualInterestRate,
  originalRemainingSchedule,
  strategy = 'tenure'
) {
  const newBalance = currentBalance - prepaymentAmount;
  const originalRemainingTenure = originalRemainingSchedule.length;

  const originalTotalInterest = originalRemainingSchedule.reduce(
    (sum, row) => sum + row.interestComponent,
    0
  );

  if (newBalance <= 0) {
    // Fully paid off
    return {
      interestSaved: parseFloat(originalTotalInterest.toFixed(2)),
      originalTenureRemaining: originalRemainingTenure,
      newTenureRemaining: 0,
      monthsReduced: originalRemainingTenure,
      newEmi: 0,
      emiReduction: parseFloat(emiAmount.toFixed(2)),
      strategy,
    };
  }

  const r = annualInterestRate / 12 / 100;

  if (strategy === 'emi') {
    // Strategy: Lower Monthly EMI (keep remaining tenure same)
    const newEmi = calculateEMI(newBalance, annualInterestRate, originalRemainingTenure);
    let simulatedBalance = newBalance;
    let newTotalInterest = 0;

    for (let i = 1; i <= originalRemainingTenure; i++) {
      let interestThisMonth = simulatedBalance * r;
      let principalThisMonth = newEmi - interestThisMonth;

      if (i === originalRemainingTenure || simulatedBalance - principalThisMonth <= 0) {
        principalThisMonth = simulatedBalance;
        simulatedBalance = 0;
      } else {
        simulatedBalance -= principalThisMonth;
      }

      newTotalInterest += interestThisMonth;
      if (simulatedBalance <= 0) break;
    }

    const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);
    const emiReduction = Math.max(0, emiAmount - newEmi);

    return {
      interestSaved: parseFloat(interestSaved.toFixed(2)),
      originalTenureRemaining: originalRemainingTenure,
      newTenureRemaining: originalRemainingTenure,
      monthsReduced: 0,
      newEmi: parseFloat(newEmi.toFixed(2)),
      emiReduction: parseFloat(emiReduction.toFixed(2)),
      strategy: 'emi',
    };
  }

  // Strategy: Reduce Tenure (keep EMI same, payoff early)
  let simulatedBalance = newBalance;
  let newTenureRemaining = 0;
  let newTotalInterest = 0;

  // Protect against infinite loop if EMI is somehow less than interest
  const maxIterations = 1000;
  
  while (simulatedBalance > 0.01 && newTenureRemaining < maxIterations) {
    newTenureRemaining++;
    let interestThisMonth = simulatedBalance * r;
    let principalThisMonth = emiAmount - interestThisMonth;

    if (simulatedBalance - principalThisMonth <= 0) {
      principalThisMonth = simulatedBalance;
      interestThisMonth = simulatedBalance * r;
      simulatedBalance = 0;
    } else {
      simulatedBalance -= principalThisMonth;
    }

    newTotalInterest += interestThisMonth;
  }

  const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);
  const monthsReduced = Math.max(0, originalRemainingTenure - newTenureRemaining);

  return {
    interestSaved: parseFloat(interestSaved.toFixed(2)),
    originalTenureRemaining: originalRemainingTenure,
    newTenureRemaining,
    monthsReduced,
    newEmi: parseFloat(emiAmount.toFixed(2)),
    emiReduction: 0,
    strategy: 'tenure',
  };
}

module.exports = {
  calculateEMI,
  generateAmortizationSchedule,
  simulatePrepayment,
};
