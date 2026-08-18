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
 * @returns {Object} Simulation results including interest saved and new tenure
 */
function simulatePrepayment(
  prepaymentAmount,
  currentBalance,
  emiAmount,
  annualInterestRate,
  originalRemainingSchedule
) {
  const newBalance = currentBalance - prepaymentAmount;

  if (newBalance <= 0) {
    // Fully paid off
    const originalTotalInterest = originalRemainingSchedule.reduce(
      (sum, row) => sum + row.interestComponent,
      0
    );
    return {
      interestSaved: parseFloat(originalTotalInterest.toFixed(2)),
      originalTenureRemaining: originalRemainingSchedule.length,
      newTenureRemaining: 0,
      monthsReduced: originalRemainingSchedule.length,
    };
  }

  // Calculate new schedule from the new balance, assuming same EMI
  // We use a high max tenure to see how long it takes to hit 0 safely
  const r = annualInterestRate / 12 / 100;
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

  const originalTotalInterest = originalRemainingSchedule.reduce(
    (sum, row) => sum + row.interestComponent,
    0
  );

  const interestSaved = originalTotalInterest - newTotalInterest;
  const originalTenureRemaining = originalRemainingSchedule.length;
  const monthsReduced = originalTenureRemaining - newTenureRemaining;

  return {
    interestSaved: parseFloat(Math.max(0, interestSaved).toFixed(2)),
    originalTenureRemaining,
    newTenureRemaining,
    monthsReduced: Math.max(0, monthsReduced),
  };
}

module.exports = {
  calculateEMI,
  generateAmortizationSchedule,
  simulatePrepayment,
};
