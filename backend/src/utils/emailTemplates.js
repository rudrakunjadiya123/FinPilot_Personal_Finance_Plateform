// ═══════════════════════════════════════════════════════════
// FINPILOT — Email Templates
// HTML templates for all reminder and summary emails
// Per SRS Section 9.4
// ═══════════════════════════════════════════════════════════

/**
 * EMI due reminder email
 */
function emiDueTemplate({ userName, loanType, emiAmount, dueDate, month }) {
  return {
    subject: `Finpilot Reminder: ${loanType} loan EMI due on ${dueDate}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F7F6F2; border-radius: 8px;">
        <h2 style="color: #1F4741; margin-bottom: 8px;">EMI Payment Reminder</h2>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #1B2430;">Hi ${userName},</p>
        <p style="color: #1B2430;">Your <strong>${loanType}</strong> loan EMI is due soon:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Amount</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: #1F4741; font-weight: bold;">₹${Number(emiAmount).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Due Date</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Month</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">${month}</td>
          </tr>
        </table>
        <p style="color: #1B2430; font-size: 13px;">Log in to Finpilot to mark this EMI as paid once settled.</p>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #999; font-size: 11px;">This is an automated reminder from Finpilot. You can adjust reminder settings in your profile.</p>
      </div>
    `,
  };
}

/**
 * Lend/Borrow due or overdue reminder (sent to user)
 */
function lendBorrowReminderTemplate({ userName, personName, amount, type, expectedReturnDate, isOverdue }) {
  const statusLabel = isOverdue ? "OVERDUE" : "due soon";
  const statusColor = isOverdue ? "#A8452F" : "#B8945F";
  const actionVerb = type === "lent" ? "lent to" : "borrowed from";

  return {
    subject: `Finpilot: Money ${actionVerb} ${personName} is ${statusLabel}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F7F6F2; border-radius: 8px;">
        <h2 style="color: #1F4741; margin-bottom: 8px;">Lend/Borrow Reminder</h2>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #1B2430;">Hi ${userName},</p>
        <p style="color: #1B2430;">
          The amount you <strong>${actionVerb} ${personName}</strong> is 
          <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span>:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Amount</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: #1F4741; font-weight: bold;">₹${Number(amount).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Expected Return</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: ${statusColor};">${expectedReturnDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Type</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">${type === "lent" ? "You lent" : "You borrowed"}</td>
          </tr>
        </table>
        <p style="color: #1B2430; font-size: 13px;">Log in to Finpilot to log a repayment or follow up.</p>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #999; font-size: 11px;">Automated reminder from Finpilot.</p>
      </div>
    `,
  };
}

/**
 * Credit card bill due reminder
 */
function creditCardDueTemplate({ userName, cardName, last4, totalAmount, minimumDue, dueDate }) {
  return {
    subject: `Finpilot Reminder: ${cardName} (****${last4}) bill due on ${dueDate}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F7F6F2; border-radius: 8px;">
        <h2 style="color: #1F4741; margin-bottom: 8px;">Credit Card Bill Reminder</h2>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #1B2430;">Hi ${userName},</p>
        <p style="color: #1B2430;">Your <strong>${cardName}</strong> (****${last4}) bill is due soon:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Total Due</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: #1F4741; font-weight: bold;">₹${Number(totalAmount).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Minimum Due</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: #B8945F;">₹${Number(minimumDue).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Due Date</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #A8452F; font-weight: bold;">${dueDate}</td>
          </tr>
        </table>
        <p style="color: #A8452F; font-size: 13px; font-style: italic;">Paying only the minimum due will result in interest charges on the remaining balance.</p>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #999; font-size: 11px;">Automated reminder from Finpilot.</p>
      </div>
    `,
  };
}

/**
 * Monthly summary email (REM-7)
 */
function monthlySummaryTemplate({ userName, month, totalIncome, totalObligations, cashFlow, unpaidEmis, unpaidCcBills, overdueRecords, goals }) {
  const cashFlowColor = cashFlow >= 0 ? "#1F4741" : "#A8452F";

  let goalsHtml = "";
  if (goals && goals.summary && goals.summary.length > 0) {
    const gls = goals.summary.map(g => `<li><strong>${g.goalType}:</strong> ${g.paceStatus}</li>`).join("");
    goalsHtml = `
      <h3 style="color: #1F4741; margin-bottom: 12px; margin-top: 16px;">Goal Pace Tracking</h3>
      <ul style="color: #1B2430; padding-left: 20px;">
        ${gls}
      </ul>
      <p style="color: #B8945F; font-size: 13px;"><em>Note: ${goals.globalPaceState}</em></p>
    `;
  }

  return {
    subject: `Finpilot: Your ${month} Financial Summary`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #F7F6F2; border-radius: 8px;">
        <h2 style="color: #1F4741; margin-bottom: 8px;">Monthly Financial Summary</h2>
        <p style="color: #B8945F; font-size: 14px; margin-top: 0;">${month}</p>
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #1B2430;">Hi ${userName},</p>
        
        <h3 style="color: #1F4741; margin-bottom: 12px;">Cash Flow Overview</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Total Income</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: #1F4741;">₹${Number(totalIncome).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430;">Total Obligations</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: #A8452F;">₹${Number(totalObligations).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; color: #1B2430; font-weight: bold;">Net Cash Flow</td>
            <td style="padding: 8px 12px; background: #fff; border: 1px solid #DDD8CE; font-family: 'JetBrains Mono', monospace; color: ${cashFlowColor}; font-weight: bold;">₹${Number(cashFlow).toLocaleString("en-IN")}</td>
          </tr>
        </table>

        ${goalsHtml}

        <h3 style="color: #1F4741; margin-bottom: 12px;">Action Items</h3>
        <ul style="color: #1B2430; padding-left: 20px;">
          <li>${unpaidEmis} unpaid EMI(s) this month</li>
          <li>${unpaidCcBills} unpaid credit card bill(s)</li>
          <li>${overdueRecords} overdue lend/borrow record(s)</li>
        </ul>
        
        <p style="color: #1B2430; font-size: 13px; margin-top: 16px;">
          Don't forget to enter this month's credit card statement when it arrives.
        </p>
        
        <hr style="border: none; border-top: 1px solid #DDD8CE; margin: 16px 0;" />
        <p style="color: #999; font-size: 11px;">Automated monthly summary from Finpilot.</p>
      </div>
    `,
  };
}

module.exports = {
  emiDueTemplate,
  lendBorrowReminderTemplate,
  creditCardDueTemplate,
  monthlySummaryTemplate,
};
