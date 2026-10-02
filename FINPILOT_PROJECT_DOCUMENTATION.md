<p align="center">
  <strong>🚀 FINPILOT — AI-Powered Personal Finance Platform</strong>
</p>

<p align="center">
  <em>Loan, Lending, Credit Card & Cash Flow Manager with AI Chatbot</em>
</p>

---

# 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Project Structure](#4-project-structure)
5. [Module 1 — Authentication & User Management](#5-module-1--authentication--user-management)
6. [Module 2 — Loan Management & EMI Tracking](#6-module-2--loan-management--emi-tracking)
7. [Module 3 — Lend/Borrow Management](#7-module-3--lendborrow-management)
8. [Module 4 — Income Management](#8-module-4--income-management)
9. [Module 5 — Dashboard & Cash Flow Analytics](#9-module-5--dashboard--cash-flow-analytics)
10. [Module 6 — Automated Reminder System](#10-module-6--automated-reminder-system)
11. [Module 7 — AI Chatbot with RAG](#11-module-7--ai-chatbot-with-rag)
12. [Module 8 — PII Redaction Engine](#12-module-8--pii-redaction-engine)
13. [Module 9 — Embedding & Vector Search (pgvector)](#13-module-9--embedding--vector-search-pgvector)
14. [Module 10 — Debt Optimization Engine](#14-module-10--debt-optimization-engine)
15. [Module 11 — Financial Goal Tracking](#15-module-11--financial-goal-tracking)
16. [Module 12 — Bank Statement Intelligence](#16-module-12--bank-statement-intelligence)
17. [Background Worker System](#17-background-worker-system)
18. [Database Schema (Prisma)](#18-database-schema-prisma)
19. [Frontend Application](#19-frontend-application)
20. [API Endpoints Reference](#20-api-endpoints-reference)
21. [Environment Configuration](#21-environment-configuration)
22. [Getting Started](#22-getting-started)

---

## 1. Project Overview

**FinPilot** is a full-stack AI-powered personal finance management platform that enables users to:

- Track and manage loans with auto-generated EMI amortization schedules
- Manage personal lending and borrowing with interest calculations (simple & compound)
- Upload and analyze bank statements with AI-powered transaction categorization
- Get AI-driven financial insights via an intelligent chatbot backed by RAG (Retrieval Augmented Generation)
- Set and track financial goals (savings & debt payoff)
- Receive automated email reminders for upcoming EMIs and overdue debts
- Optimize debt repayment strategies (Avalanche vs Snowball analysis)
- View a comprehensive dashboard with KPIs, cash flow analysis, and spending breakdowns

---

## 2. Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **Prisma ORM (v7.8)** | Database ORM with type-safe queries |
| **PostgreSQL** | Primary relational database |
| **pgvector** | Vector similarity search for RAG embeddings |
| **Redis (ioredis)** | Caching (dashboard data) & session management |
| **BullMQ** | Background job queue (reminders, embeddings) |
| **Google Generative AI (Gemini)** | LLM for chatbot & transaction categorization |
| **Brevo (Sendinblue)** | Transactional email (API + SMTP relay) |
| **Nodemailer** | SMTP fallback email transport |
| **bcryptjs** | Password hashing (10 salt rounds) |
| **jsonwebtoken** | JWT-based authentication (access + refresh tokens) |
| **Zod (v4)** | Request validation schemas |
| **Multer** | File upload handling (PDF/CSV statements) |
| **pdf-parse** | PDF parsing for bank statements |
| **csv-parse** | CSV parsing for bank statements |
| **fuzzysort** | Fuzzy string matching for merchant categorization |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **TanStack React Query v5** | Server state management & caching |
| **Zustand** | Client-side state management |
| **Tailwind CSS v4** | Utility-first CSS framework |
| **Recharts** | Data visualization (charts & graphs) |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **react-markdown** | Markdown rendering (for chatbot responses) |
| **jsPDF + html2canvas** | PDF export functionality |
| **react-datepicker** | Date picker component |

### Infrastructure
| Service | Purpose |
|---|---|
| **Vercel** | Frontend deployment |
| **Render** | Backend deployment |
| **PostgreSQL (Cloud)** | Database hosting |
| **Redis (Cloud)** | Cache & queue hosting |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  Landing │ Dashboard │ Loans │ Lend/Borrow │ Chat │ Goals   │
│  Statements │ Income │ Login/Register                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (Axios + httpOnly Cookies)
┌──────────────────────────▼──────────────────────────────────┐
│                 BACKEND (Node.js + Express 5)               │
│  ┌─────────┐ ┌────────┐ ┌───────────────┐ ┌─────────────┐  │
│  │  Auth   │ │ Loans  │ │  Lend/Borrow  │ │  Dashboard  │  │
│  │Middleware│ │ CRUD + │ │ CRUD + Repay  │ │ Cash Flow + │  │
│  │ (JWT)   │ │ EMI    │ │ + Interest    │ │ Net Worth   │  │
│  └─────────┘ └────────┘ └───────────────┘ └─────────────┘  │
│  ┌──────────────────┐ ┌──────────────────────────────────┐  │
│  │   AI Chatbot     │ │   Statement Intelligence         │  │
│  │  RAG + Function  │ │  Parse → Categorize → Insights   │  │
│  │  Calling + PII   │ │  (Rule→Fuzzy→Embedding→LLM)     │  │
│  │  Redaction       │ │  + Loan Auto-Matching            │  │
│  └──────────────────┘ └──────────────────────────────────┘  │
│  ┌────────────┐ ┌──────────┐ ┌────────────────────────────┐ │
│  │  Goals     │ │Optimizer │ │  Computation Engine        │ │
│  │  Tracking  │ │Avalanche │ │  EMI • Amortization •      │ │
│  │  + Pace    │ │Snowball  │ │  Prepayment Simulation     │ │
│  └────────────┘ └──────────┘ └────────────────────────────┘ │
└─────┬──────────────┬────────────────────────┬───────────────┘
      │              │                        │
┌─────▼─────┐  ┌─────▼──────┐  ┌──────────────▼───────────────┐
│PostgreSQL │  │   Redis    │  │     Background Worker        │
│ + pgvector│  │ (Caching)  │  │  BullMQ: Reminders, Embeds,  │
│           │  │ (Sessions) │  │  Monthly Summary Emails      │
└───────────┘  └────────────┘  └──────────────────────────────┘
                                        │
                                  ┌─────▼─────┐
                                  │  Brevo    │
                                  │  Email    │
                                  │  Service  │
                                  └───────────┘
```

---

## 4. Project Structure

```
FinPilot/
├── .env.example                  # Environment variable template
├── backend/
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (14 models)
│   │   └── migrations/           # Prisma migration history
│   └── src/
│       ├── app.js                # Express app setup & route mounting
│       ├── server.js             # HTTP server entry point
│       ├── worker.js             # BullMQ background workers
│       ├── config/
│       │   ├── db.js             # Prisma client singleton
│       │   ├── redis.js          # Redis (ioredis) connection
│       │   └── queues.js         # BullMQ queue definitions
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── loan.controller.js
│       │   ├── lendBorrow.controller.js
│       │   ├── income.controller.js
│       │   ├── dashboard.controller.js
│       │   ├── chat.controller.js
│       │   ├── goal.controller.js
│       │   ├── statement.controller.js
│       │   ├── optimization.controller.js
│       │   └── reminder.controller.js
│       ├── routes/
│       │   ├── auth.routes.js          → /api/auth
│       │   ├── loan.routes.js          → /api/loans
│       │   ├── lendBorrow.routes.js    → /api/lendborrow
│       │   ├── income.routes.js        → /api/income
│       │   ├── dashboard.routes.js     → /api/dashboard
│       │   ├── chat.routes.js          → /api/chat
│       │   ├── goal.routes.js          → /api/goals
│       │   ├── statement.routes.js     → /api/statements
│       │   ├── optimization.routes.js  → /api/optimization
│       │   └── reminder.routes.js      → /api/reminders
│       ├── services/
│       │   ├── llm.service.js            # Gemini LLM integration
│       │   ├── rag.service.js            # RAG context retrieval
│       │   ├── embedding.service.js      # Vector embedding generation
│       │   ├── email.service.js          # Brevo email (API + SMTP)
│       │   ├── optimization.service.js   # Debt strategy math
│       │   ├── goal.service.js           # Goal pace & projection
│       │   ├── dashboard.service.js      # Cash flow computation
│       │   ├── categorization.service.js # Transaction categorization
│       │   ├── statementParsing.service.js # PDF/CSV parsing
│       │   ├── statementAnalysis.service.js # Spending insights
│       │   └── loanMatching.service.js   # AI loan auto-matching
│       ├── middleware/
│       │   ├── auth.js               # JWT authentication
│       │   └── errorHandler.js       # Global error handler
│       ├── utils/
│       │   ├── computationEngine.js  # EMI, amortization, prepayment math
│       │   ├── constants.js          # App-wide constants
│       │   ├── emailTemplates.js     # HTML email templates
│       │   ├── redaction.js          # PII redaction/re-injection
│       │   └── asyncHandler.js       # Async express error wrapper
│       └── validators/
│           ├── auth.validator.js
│           ├── loan.validator.js
│           ├── lendBorrow.validator.js
│           └── income.validator.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── vercel.json
│   └── src/
│       ├── main.jsx               # App entry point
│       ├── App.css / index.css    # Global styles
│       ├── routes/
│       │   └── AppRoutes.jsx      # Route definitions
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── LoansListPage.jsx
│       │   ├── LoanDetailPage.jsx
│       │   ├── LendBorrowPage.jsx
│       │   ├── LendBorrowDetailPage.jsx
│       │   ├── PersonHistoryPage.jsx
│       │   ├── IncomePage.jsx
│       │   ├── GoalsPage.jsx
│       │   ├── GoalHistoryPage.jsx
│       │   ├── StatementsPage.jsx
│       │   └── ChatPage.jsx
│       ├── components/
│       │   ├── AddLoanModal.jsx
│       │   ├── AddLendBorrowModal.jsx
│       │   ├── AddIncomeModal.jsx
│       │   ├── AddGoalModal.jsx
│       │   ├── LoanCard.jsx
│       │   ├── LendBorrowCard.jsx
│       │   ├── GoalCard.jsx
│       │   ├── EMIScheduleTable.jsx
│       │   ├── PrepaymentSimulatorPanel.jsx
│       │   ├── RepaymentLogModal.jsx
│       │   ├── ChangeInterestModal.jsx
│       │   ├── UpdateGoalProgressModal.jsx
│       │   ├── ChatPanel.jsx
│       │   ├── NotificationBell.jsx
│       │   ├── LoanSuggestionsWidget.jsx
│       │   ├── DataTable.jsx
│       │   ├── MarkdownRenderer.jsx
│       │   └── primitives/          # Reusable UI primitives
│       ├── context/
│       │   ├── AuthContext.jsx      # Authentication state
│       │   └── UploadContext.jsx    # Statement upload state
│       ├── hooks/
│       │   ├── useLoans.js
│       │   ├── useLendBorrow.js
│       │   ├── useIncome.js
│       │   ├── useGoals.js
│       │   ├── useChat.js
│       │   ├── useStatements.js
│       │   └── useDashboardData.js
│       ├── services/
│       │   └── apiClient.js         # Axios instance with interceptors
│       ├── store/
│       │   └── uiStore.js           # Zustand global UI state
│       ├── layouts/
│       │   └── AppShell.jsx         # Authenticated layout wrapper
│       ├── styles/                  # Additional stylesheets
│       ├── assets/                  # Static assets
│       └── utils/                   # Frontend utility functions
└── srs_statement/                   # SRS & design documentation
    ├── Finpilot_Final_SRS.md
    ├── Finpilot_Master_Spec.md
    ├── design.md
    └── ...
```

---

## 5. Module 1 — Authentication & User Management

### Overview
Complete user authentication system using **JWT tokens** stored in **httpOnly cookies** with automatic token refresh rotation. Includes password reset via email with time-limited tokens stored in Redis.

### Features

| Feature | Description |
|---|---|
| **User Registration** | Name, email, password with bcrypt hashing (10 salt rounds) |
| **Login** | Email/password authentication, returns JWT access + refresh tokens in httpOnly cookies |
| **Token Refresh** | Opaque refresh tokens stored in Redis with 7-day TTL, automatic rotation on refresh |
| **Logout** | Clears cookies and invalidates refresh token in Redis |
| **Get Profile** | Returns user profile including preferences (currency, reminder settings) |
| **Update Profile** | Update name, currency, monthly income target, reminder preferences |
| **Password Reset** | Email-based flow with SHA-256 hashed tokens (1-hour TTL in Redis) |
| **Delete Account** | Cascade deletes all user data, invalidates cache, clears cookies |
| **Data Export** | Full JSON export of all user data (loans, records, sessions, etc.) |

### Security Measures
- Passwords hashed with **bcrypt** (10 salt rounds)
- Access tokens: **15-minute expiry** (JWT)
- Refresh tokens: **7-day TTL** (opaque random string stored in Redis)
- HttpOnly, Secure, SameSite cookie attributes
- Cross-origin support for Vercel ↔ Render deployment
- Email enumeration prevention on password reset
- Zod schema validation on all inputs

### API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login with credentials |
| `POST` | `/api/auth/refresh` | Public | Rotate tokens |
| `POST` | `/api/auth/logout` | Public | Logout & invalidate tokens |
| `POST` | `/api/auth/request-password-reset` | Public | Request password reset email |
| `POST` | `/api/auth/reset-password` | Public | Reset password with token |
| `GET` | `/api/auth/me` | 🔒 | Get user profile |
| `PUT` | `/api/auth/profile` | 🔒 | Update user profile |
| `DELETE` | `/api/auth/account` | 🔒 | Delete user account |
| `GET` | `/api/auth/export-data` | 🔒 | Export all user data as JSON |

### Database Model

```
User {
  id                  String   (UUID, PK)
  name                String
  email               String   (unique)
  passwordHash        String
  currency            String   (default: "INR")
  monthlyIncomeTarget Decimal?
  reminderDaysBefore  Int      (default: 3)
  reminderEmailOn     Boolean  (default: true)
  createdAt           DateTime
}
```

---

## 6. Module 2 — Loan Management & EMI Tracking

### Overview
Full lifecycle loan management with automatic EMI calculation, amortization schedule generation, EMI payment tracking, and prepayment simulation capabilities.

### Features

| Feature | Description |
|---|---|
| **CRUD Operations** | Create, read, update, delete loans |
| **Auto EMI Calculation** | Deterministic EMI computation using standard formula: `EMI = P × r × (1+r)^n / ((1+r)^n - 1)` |
| **Amortization Schedule** | Auto-generates month-by-month principal/interest breakdown on loan creation |
| **Mark EMI Paid** | Marks individual EMI installments as paid, reduces outstanding balance atomically |
| **Prepayment Simulation** | Simulates lump-sum prepayment with two strategies: **Reduce Tenure** or **Reduce EMI** |
| **Confirm Prepayment** | Applies prepayment permanently — deletes old schedule, regenerates new one atomically |
| **Close Loan** | Marks a loan as closed |
| **AI Loan Suggestions** | 3-Factor auto-matching: matches bank statement transactions to existing loans |
| **Accept/Reject Suggestions** | User can accept (auto-marks EMI paid) or reject AI-generated suggestions |
| **Embedding Generation** | Notes on loans are embedded as vectors for RAG chatbot context |
| **Cache Invalidation** | Dashboard caches (Redis) are invalidated on every write operation |

### Loan Types Supported
`home` | `personal` | `auto` | `education` | `other`

### Prepayment Strategies
1. **Tenure Reduction** — Keep EMI same, pay off earlier, save maximum interest
2. **EMI Reduction** — Keep tenure same, lower monthly payment

### Computation Engine Functions
```javascript
calculateEMI(principal, annualRate, tenureMonths)
generateAmortizationSchedule(principal, rate, tenure, emi, startDate)
simulatePrepayment(amount, balance, emi, rate, schedule, strategy)
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/loans` | List all user loans |
| `POST` | `/api/loans` | Create loan (auto-generates EMI schedule) |
| `GET` | `/api/loans/:id` | Get loan by ID |
| `PUT` | `/api/loans/:id` | Update loan details |
| `DELETE` | `/api/loans/:id` | Delete loan (cascades to schedule & embeddings) |
| `PUT` | `/api/loans/:id/close` | Close a loan |
| `GET` | `/api/loans/:id/schedule` | Get amortization schedule |
| `PUT` | `/api/loans/:id/schedule/:emiId/mark-paid` | Mark specific EMI as paid |
| `POST` | `/api/loans/:id/simulate-prepayment` | Simulate prepayment impact |
| `POST` | `/api/loans/:id/confirm-prepayment` | Confirm & apply prepayment |
| `GET` | `/api/loans/suggestions` | Get pending AI loan match suggestions |
| `POST` | `/api/loans/suggestions/:id/accept` | Accept a suggestion |
| `POST` | `/api/loans/suggestions/:id/reject` | Reject a suggestion |

### Database Models

```
Loan {
  id, userId, loanType, lenderName?, principalAmount, interestRate,
  tenureMonths, emiAmount, startDate, status (active|closed),
  outstandingBalance, notes?, createdAt
}

EMISchedule {
  id, loanId, month, dueDate, principalComponent, interestComponent,
  balanceAfter, paidStatus (paid|unpaid), paidDate?
}
```

---

## 7. Module 3 — Lend/Borrow Management

### Overview
Comprehensive personal lending and borrowing tracker with support for partial repayments, interest calculations (simple & compound), variable interest rate overrides, overdue detection, per-person history, email reminders, and bank statement verification.

### Features

| Feature | Description |
|---|---|
| **CRUD Operations** | Create, read, update, delete lend/borrow records |
| **Simple & Compound Interest** | Supports both interest types with configurable compounding frequency |
| **Variable Interest Rates** | Change interest rate mid-term; history is stored as JSON array with piecewise computation |
| **Partial Repayments** | Log principal-only, interest-only, or combined payments |
| **Auto Status Derivation** | Status auto-computed: `pending` → `partial` → `repaid` based on repayment total |
| **Overdue Detection** | `isOverdue` computed on-read (not stored) by comparing expected return date |
| **Per-Person History** | View all lending/borrowing records grouped by contact email |
| **Net Outstanding** | Calculates total outstanding (positive = owed to you, negative = you owe) |
| **Email Reminders** | Send polite reminder emails with itemized table to borrowers |
| **Batch Reminders** | Send reminders to specific contacts or ALL at once |
| **Payment Mode Tracking** | Cash or online — online payments include transaction ID |
| **Bank Statement Verification** | Online payments auto-verified against uploaded bank statements |
| **Embedding Generation** | Notes embedded for RAG chatbot context |

### Interest Computation Engine
- **Simple Interest**: `P × R × T / 365` (day-level precision)
- **Compound Interest**: `P × (1 + r/n)^(n×t) - P` where `n = 12/frequency`
- **Piecewise Calculation**: Supports rate changes mid-term with interval-based computation
- **Interest Rate History**: JSON array storing `{ date, rate, interestType, compoundingFrequency }`

### Repayment Types
| Type | Description |
|---|---|
| `principal_only` | Reduces outstanding principal |
| `interest_only` | Covers accrued interest only |
| `principal_interest` | Split payment with explicit principal & interest amounts |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/lendborrow` | List all records (enriched with computed fields) |
| `POST` | `/api/lendborrow` | Create new lend/borrow record |
| `GET` | `/api/lendborrow/:id` | Get record by ID (enriched) |
| `PUT` | `/api/lendborrow/:id` | Update record |
| `DELETE` | `/api/lendborrow/:id` | Delete record (cascades) |
| `POST` | `/api/lendborrow/:id/repayment` | Log partial repayment |
| `POST` | `/api/lendborrow/:id/interest-rate` | Change interest rate (variable rate override) |
| `GET` | `/api/lendborrow/overdue` | Get all overdue records |
| `GET` | `/api/lendborrow/person/:email` | Get per-person history & net outstanding |
| `POST` | `/api/lendborrow/remind` | Send reminder email(s) to borrowers |

### Database Models

```
LendBorrowRecord {
  id, userId, personName, personEmail, amount, type (lent|borrowed),
  dateGiven, expectedReturnDate, interestRate?, status (pending|partial|repaid),
  notes?, interestType (simple|compound), compoundingFrequency?, interestStartDate?,
  interestRateHistory (JSON), paymentMode (cash|online), transactionId?,
  verificationStatus (not_required|pending_verification|verified),
  linkedTransactionId?, createdAt
}

RepaymentHistory {
  id, lendBorrowId, amount, date, paymentType, principalAmount, interestAmount,
  paymentMode, transactionId?, verificationStatus, linkedTransactionId?
}
```

---

## 8. Module 4 — Income Management

### Overview
Simple income entry management for tracking salary, freelance, and other income sources on a monthly basis. Feeds into dashboard cash flow calculations.

### Features
- Add monthly income entries with source type and amount
- View all income entries sorted by month (descending)
- Delete income entries
- Automatic Redis cache invalidation on writes

### Income Sources
`salary` | `freelance` | `other`

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/income` | List all income entries |
| `POST` | `/api/income` | Add new income entry |
| `DELETE` | `/api/income/:id` | Delete income entry |

### Database Model

```
IncomeEntry {
  id, userId, source, amount, month (DateTime), createdAt
}
```

---

## 9. Module 5 — Dashboard & Cash Flow Analytics

### Overview
Comprehensive financial dashboard providing real-time KPIs, cash flow breakdown, net worth calculation, spending analysis, 12-month trend data, and dynamic AI-generated insights.

### Features

| Feature | Description |
|---|---|
| **Cash Flow** | `Income − EMIs Due = Monthly Cash Flow` with per-month granularity |
| **Net Worth** | `Lent Receivables − (Loan Balances + Borrowed Amounts)` |
| **12-Month Trend** | Cash flow data for last 12 months for charting |
| **Spending Analysis** | Category breakdown: Food, Shopping, Rent, Transport, Utilities, Entertainment, Other |
| **Goal Progress** | Active goals with percentage completion |
| **Dynamic AI Insights** | 5 categories of personalized, data-driven insights (not template-based) |
| **Redis Caching** | 1-hour TTL caching for cash flow and net worth calculations |

### AI Insights Generated
1. **Top Spending Category** — Identifies highest category with % and savings potential
2. **Debt Interest Optimization** — Highlights highest-rate loan for priority prepayment
3. **Goal Pace** — Tracks slowest-progressing goal with actionable advice
4. **Cash Flow Surplus** — Calculates available surplus after expenses
5. **Receivables Alert** — Outstanding lent amounts to collect

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/cashflow?month=YYYY-MM` | Monthly cash flow |
| `GET` | `/api/dashboard/networth` | Net worth calculation |
| `GET` | `/api/dashboard/trend` | 12-month cash flow trend |
| `GET` | `/api/dashboard/summary` | Full dashboard summary (KPIs + insights + spending + goals) |

### Dashboard Summary Response Structure
```json
{
  "kpis": { "netWorth", "monthlyIncome", "monthlyExpense", "totalDebt", "availableCash", "totalEmi" },
  "cashFlowBreakdown": { "income", "expenses", "savings", "history" },
  "spendingAnalysis": { "food", "shopping", "rent", "transport", "utilities", "entertainment", "other", "moneyLent", "toReceive", "moneyBorrowed", "toPay" },
  "goals": [{ "id", "name", "targetAmount", "currentSaved", "percentage", "status" }],
  "aiInsights": ["string..."]
}
```

---

## 10. Module 6 — Automated Reminder System

### Overview
Background job system that scans for upcoming EMI due dates and overdue lend/borrow records, then dispatches email reminders via BullMQ workers.

### Features
- **Daily Reminder Scan**: Checks all opted-in users for upcoming obligations
- **Configurable Lead Time**: User-defined `reminderDaysBefore` setting (default: 3)
- **EMI Reminders**: Alerts for unpaid EMIs within the scan horizon
- **Lend/Borrow Reminders**: Alerts for records nearing or past expected return date
- **Idempotent Delivery**: Database-level deduplication via `ReminderLog` to prevent spam
- **Monthly Summary Emails**: Automated monthly digest with income, obligations, goals

### Reminder Types
`emi` | `lend_borrow` | `credit_card` | `monthly_summary`

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders/logs?limit=20&offset=0` | Paginated reminder history |

### Database Model

```
ReminderLog {
  id, userId, type, relatedRecordId, status (sent|failed),
  errorMessage?, sentAt, channel (default: "email")
}
```

---

## 11. Module 7 — AI Chatbot with RAG

### Overview
Conversational AI financial assistant powered by **Google Gemini** with **Retrieval Augmented Generation (RAG)**, **Function Calling**, multi-turn conversation memory, and **PII redaction**. Enables natural-language interaction with the user's financial data.

### Features

| Feature | Description |
|---|---|
| **RAG Context Retrieval** | Combines structured DB queries + semantic vector search for personalized answers |
| **Function Calling** | LLM can invoke backend tools (compare strategies, check goal pace, spending insights, create lend records) |
| **Multi-Turn Memory** | Last 20 messages per session for conversation context |
| **Session Management** | Create, list, view, delete chat sessions |
| **PII Redaction** | Automatically redacts person names/emails before LLM call, re-injects on response |
| **Redacted Payload Logging** | Stores what was actually sent to the LLM for audit/debugging |
| **Graceful Degradation** | Fails gracefully if LLM service is unavailable |

### Registered Function Tools (Gemini)

| Tool Name | Description |
|---|---|
| `get_total_interest_paid` | Total projected interest across active loans |
| `get_overdue_lend_records` | All overdue lend/borrow records |
| `check_emi_affordability` | Evaluates if a new EMI is affordable |
| `simulate_prepayment` | Simulates interest saved on a prepayment |
| `compare_debt_strategies` | Avalanche vs Snowball analysis with optional extra payment |
| `check_goal_pace` | Check if a specific goal is on track |
| `simulate_goal_adjustment` | Simulate changing monthly contribution |
| `list_active_goals_summary` | Summary of all active goals |
| `get_spending_insights` | AI spending change analysis for a month |
| `get_spending_by_category` | Category-wise spending breakdown |
| `extract_lend_record` | Extract structured data from natural language lending statement |
| `create_lend_record` | Create a lend/borrow record (after user confirmation) |

### Chatbot Flow
```
User Message
    ↓
Resolve/Create Session
    ↓
Save User Message to DB
    ↓
┌──────────────────────────────────┐
│  RAG Context Retrieval           │
│  ├─ Structured DB queries        │
│  │  (loans, lend/borrow, income) │
│  └─ Semantic vector search       │
│     (pgvector cosine distance)   │
└──────────────────────────────────┘
    ↓
PII Redaction (names, emails → placeholders)
    ↓
Fetch last 20 messages (redacted)
    ↓
Send to Gemini (with context + history + tools)
    ↓
┌──────────────────────────────────┐
│  If Function Call:               │
│  → Execute tool locally          │
│  → Redact tool output            │
│  → Send function response back   │
│  → Get final text response       │
│                                  │
│  If Text Response:               │
│  → Use directly                  │
└──────────────────────────────────┘
    ↓
Re-inject PII into response
    ↓
Save assistant message to DB
    ↓
Return response to user
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/ask` | Send message, get AI response |
| `GET` | `/api/chat/sessions` | List all chat sessions |
| `POST` | `/api/chat/sessions` | Create new empty session |
| `GET` | `/api/chat/sessions/:sessionId` | Get session with all messages |
| `DELETE` | `/api/chat/sessions/:sessionId` | Delete session (cascades messages) |

### Database Models

```
ChatSession {
  id, userId, title?, createdAt, updatedAt
}

ChatMessage {
  id, sessionId, role (user|assistant), content,
  redactedPayloadSent (JSON)?, pathUsed (function_call|rag)?, createdAt
}
```

---

## 12. Module 8 — PII Redaction Engine

### Overview
Automatic personally identifiable information (PII) redaction layer that protects user data before it reaches any external LLM service.

### How It Works

1. **Extraction**: PII entries (name + email) are collected from lend/borrow records during RAG context formatting
2. **Redaction**: All occurrences are replaced with indexed placeholders:
   - Names → `[PERSON_1]`, `[PERSON_2]`, etc.
   - Emails → `[EMAIL_1]`, `[EMAIL_2]`, etc.
3. **Re-injection**: After LLM responds, placeholders are replaced back with original values

### Applied To
- Financial context sent to LLM
- Chat history sent to LLM
- User message sent to LLM
- Function call results sent to LLM

### Functions
```javascript
redactPII(text, piiEntries)     → { redactedText, piiMap }
reinjectPII(text, piiMap)       → text with originals restored
```

---

## 13. Module 9 — Embedding & Vector Search (pgvector)

### Overview
RAG backbone that generates vector embeddings for financial record notes and performs semantic similarity search using PostgreSQL's **pgvector** extension.

### Features
- **Embedding Model**: `text-embedding-3-small` (via Google Generative AI SDK)
- **Storage**: 768-dimensional vectors in PostgreSQL using pgvector extension
- **Search**: Cosine distance operator (`<=>`) for semantic similarity
- **Upsert**: `ON CONFLICT` semantics — updates existing embeddings on note changes
- **Background Processing**: Embedding generation happens asynchronously via BullMQ worker

### Triggers for Embedding Generation
- Loan creation (if notes provided)
- Loan update (if notes changed)
- Lend/Borrow record creation (if notes provided)
- Lend/Borrow record update (if notes changed)

### Database Model

```
NoteEmbedding {
  id, userId, recordId, recordType (loan|lendBorrow), content,
  loanId?, lendBorrowId?, createdAt, updatedAt
  // embedding vector(768) — managed via raw SQL
}
```

---

## 14. Module 10 — Debt Optimization Engine

### Overview
Analyzes the user's active debts and provides two competing repayment strategies with interest savings calculations.

### Features

| Feature | Description |
|---|---|
| **Avalanche Strategy** | Sort debts by interest rate (highest first) — minimizes total interest paid |
| **Snowball Strategy** | Sort debts by balance (smallest first) — maximizes psychological wins |
| **Extra Payment Analysis (OPT-3)** | Calculates interest savings if user applies a fixed extra monthly payment |
| **Strategy Comparison** | Shows which strategy saves more interest with the extra payment |
| **Cascading Interest** | Re-generates amortization schedules with boosted EMI for accurate projections |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/optimization?extraPayment=5000` | Get both strategies with optional extra payment analysis |

### Response Structure
```json
{
  "avalanche": [{ "id", "name", "balance", "rate", "minimumPayment" }],
  "snowball": [{ "id", "name", "balance", "rate", "minimumPayment" }],
  "opt3Analysis": {
    "avalancheInterest": 45000,
    "snowballInterest": 48000,
    "savingsDifference": 3000,
    "bestStrategy": "Avalanche"
  }
}
```

---

## 15. Module 11 — Financial Goal Tracking

### Overview
Create and track both **savings goals** (accumulate a target amount) and **debt payoff goals** (pay off a loan faster than scheduled), with pace tracking, projection, and progress logging.

### Features

| Feature | Description |
|---|---|
| **Savings Goals** | Set target amount + target date, log savings progress over time |
| **Debt Payoff Goals** | Link to existing loan, set desired payoff timeline shorter than default |
| **Progress Logging** | Record incremental savings contributions with optional notes |
| **Pace Computation** | Calculates if user is on track, behind, or ahead of schedule |
| **Projections** | Estimates completion date based on current savings rate |
| **Global Pace State** | Summary of all goals: `on_track`, `behind`, `ahead`, `needs_attention` |
| **Active Goals Summary** | Aggregated view for dashboard and monthly emails |

### Goal Types
| Type | Fields |
|---|---|
| `savings` | targetAmount, currentSaved, targetDate |
| `debt_payoff` | loanId (linked), targetMonths |

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/goals` | List all goals with global pace state |
| `POST` | `/api/goals` | Create a new financial goal |
| `GET` | `/api/goals/:id` | Get goal detail with pace analysis |
| `POST` | `/api/goals/:id/log-progress` | Log savings progress (savings goals only) |
| `DELETE` | `/api/goals/:id` | Delete a goal |

### Database Models

```
FinancialGoal {
  id, userId, goalType (savings|debt_payoff), name,
  targetAmount?, currentSaved? (default: 0), targetDate?,
  loanId?, targetMonths?, status (active|achieved|abandoned), createdAt
}

GoalProgressLog {
  id, goalId, amount, date, note?
}
```

---

## 16. Module 12 — Bank Statement Intelligence

### Overview
Upload bank statements (PDF or CSV), automatically parse transactions, categorize them using a 4-tier AI pipeline, detect spending patterns, generate insights, and auto-match EMI payments to existing loans.

### Features

| Feature | Description |
|---|---|
| **PDF/CSV Upload** | Accepts bank statement files up to 10MB |
| **Statement Parsing** | Extracts date, description, amount, type, reference number, balance |
| **4-Tier Categorization** | Rule → Fuzzy → Embedding → LLM fallback pipeline |
| **Duplicate Detection** | Prevents re-uploading the same file for the same month |
| **Needs-Review Queue** | Low-confidence transactions flagged for manual review |
| **Manual Correction** | User corrections create new rules for future auto-categorization |
| **Dashboard Metrics** | Total debits, credits, savings rate from statements |
| **Expense/Savings Trends** | Monthly trend data across all uploads |
| **AI Spending Insights** | LLM-generated natural language analysis of spending patterns |
| **3-Factor Loan Auto-Matching** | Matches debit transactions to existing loans using lender name, EMI amount, and date proximity |
| **Monthly Investment Tracking** | Manual investment entry per month |
| **Cost Summary** | Per-upload breakdown of categorization method used |
| **Bank Name Tracking** | Distinct bank names across all uploads |

### 4-Tier Categorization Pipeline

```
Transaction Description
    ↓
[Tier 1] Rule-Based Matching
    │  → Exact pattern match from MerchantCategoryRule table
    │  → Source: "rule", Confidence: 1.0
    ↓ (if no match)
[Tier 2] Fuzzy String Matching
    │  → fuzzysort against known merchant patterns
    │  → Source: "fuzzy", Confidence: 0.7-0.95
    ↓ (if no match)
[Tier 3] Embedding Similarity
    │  → Vector cosine distance against existing categorized transactions
    │  → Source: "embedding", Confidence: 0.6-0.85
    ↓ (if no match)
[Tier 4] LLM Fallback
    │  → Batch send to Gemini for AI categorization
    │  → Source: "llm", Confidence: 0.5-0.9
    ↓ (if confidence < threshold)
    Flagged for Manual Review (needsReview: true)
```

### Transaction Categories
`Food` | `Shopping` | `Rent` | `Transport` | `Utilities` | `Entertainment` | `Investment` | `Salary` | `Transfer` | `EMI/Loan` | `Other`

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/statements/upload` | Upload & process statement (multipart/form-data) |
| `GET` | `/api/statements/uploads` | List all uploaded statements |
| `DELETE` | `/api/statements/uploads/:id` | Delete an upload (cascades transactions) |
| `GET` | `/api/statements/banks` | Get distinct bank names |
| `GET` | `/api/statements/needs-review` | Get transactions flagged for review |
| `GET` | `/api/statements/dashboard` | Statement dashboard metrics |
| `GET` | `/api/statements/trend/expense` | Monthly expense trend |
| `GET` | `/api/statements/trend/savings` | Monthly savings trend |
| `GET` | `/api/statements/insights` | AI spending insights |
| `GET` | `/api/statements/:id/status` | Upload processing status |
| `GET` | `/api/statements/:id/transactions` | Get transactions for an upload |
| `GET` | `/api/statements/:id/cost-summary` | Categorization method breakdown |
| `PUT` | `/api/statements/transactions/:id/category` | Manual category correction |
| `POST` | `/api/statements/:month/investment` | Add manual investment for month |

### Database Models

```
StatementUpload {
  id, userId, fileName, fileType (pdf|csv), statementType (bank_account|credit_card),
  bankName?, month, status (processing|parsed|categorizing|completed|failed),
  totalTransactions, ruleMatchedCount, fuzzyMatchedCount, embeddingMatchedCount,
  llmFallbackCount, manualReviewCount, uploadedAt
}

Transaction {
  id, statementUploadId, userId, date, descriptionRaw, descriptionNormalized,
  refNo?, amount, type (debit|credit), balance?, category?, categorySource?,
  confidenceScore?, needsReview, createdAt
}

MerchantCategoryRule {
  id, userId, pattern, category, createdFromUserCorrection, createdAt
}

MonthlyInvestment {
  id, userId, month, amount, note?, createdAt, updatedAt
}

LoanMatchSuggestion {
  id, userId, loanId, transactionId, matchReason, factors (JSON),
  status (pending|accepted|rejected), createdAt
}
```

---

## 17. Background Worker System

### Overview
Dedicated BullMQ worker process (`worker.js`) running alongside the main API server. Handles all background tasks via Redis-backed job queues.

### Workers

| Worker | Queue | Purpose |
|---|---|---|
| **Reminder Scan** | `reminder-scan` | Scans all opted-in users for upcoming EMIs and overdue records |
| **Send Reminder Email** | `send-reminder-email` | Dispatches individual reminder emails with idempotency |
| **Monthly Summary** | `monthly-summary` | Generates and emails monthly financial summaries |
| **Embedding Generation** | `embedding-generation` | Generates pgvector embeddings for loan/record notes |

### Email Templates
- **EMI Due Reminder** — Upcoming EMI payment alert
- **Lend/Borrow Reminder** — Overdue or upcoming repayment alert
- **Monthly Summary** — Full monthly digest (income, obligations, goals)

### Commands
```bash
npm run worker        # Production
npm run worker:dev    # Development (with nodemon)
```

---

## 18. Database Schema (Prisma)

### Models (14 Total)

| Model | Description |
|---|---|
| `User` | Core user account |
| `Loan` | Loan records (home, personal, auto, education) |
| `EMISchedule` | Monthly EMI amortization rows |
| `LendBorrowRecord` | Personal lending/borrowing tracker |
| `RepaymentHistory` | Partial repayment logs |
| `IncomeEntry` | Monthly income entries |
| `ChatSession` | AI chatbot conversation sessions |
| `ChatMessage` | Individual chat messages |
| `NoteEmbedding` | pgvector embeddings for semantic search |
| `ReminderLog` | Email reminder dispatch history |
| `FinancialGoal` | Savings & debt payoff goals |
| `GoalProgressLog` | Savings progress entries |
| `StatementUpload` | Uploaded bank statements |
| `Transaction` | Parsed bank statement transactions |
| `MerchantCategoryRule` | User-corrected categorization rules |
| `MonthlyInvestment` | Manual investment entries |
| `LoanMatchSuggestion` | AI-generated loan payment matches |

### Key Relationships
```
User ──┬── Loan ──── EMISchedule
       │        └── NoteEmbedding
       │        └── FinancialGoal
       │        └── LoanMatchSuggestion
       │
       ├── LendBorrowRecord ──── RepaymentHistory
       │                    └── NoteEmbedding
       │
       ├── IncomeEntry
       ├── ChatSession ──── ChatMessage
       ├── ReminderLog
       ├── FinancialGoal ──── GoalProgressLog
       │
       ├── StatementUpload ──── Transaction
       ├── MerchantCategoryRule
       ├── MonthlyInvestment
       └── LoanMatchSuggestion
```

### Cascade Behavior
All child records use `onDelete: Cascade` — deleting a user removes all associated data automatically.

---

## 19. Frontend Application

### Pages

| Page | Route | Description |
|---|---|---|
| **Landing Page** | `/` | Marketing homepage with feature showcase |
| **Login / Register** | `/login` | Authentication forms |
| **Dashboard** | `/app` | KPIs, cash flow, spending analysis, goals, AI insights |
| **Loans List** | `/app/loans` | All loans with summary cards |
| **Loan Detail** | `/app/loans/:id` | EMI schedule, prepayment simulator |
| **Lend/Borrow** | `/app/lend-borrow` | All lending/borrowing records |
| **Lend/Borrow Detail** | `/app/lend-borrow/:id` | Repayment history, interest details |
| **Person History** | `/app/lend-borrow/person/:email` | Per-person aggregated view |
| **Income** | `/app/income` | Income entry management |
| **Goals** | `/app/goals` | Financial goal tracking |
| **Goal History** | `/app/goals/:id` | Goal progress timeline |
| **Statements** | `/app/statements` | Bank statement upload & analysis |
| **Chat** | `/app/chat` | AI chatbot interface |

### Key Components

| Component | Purpose |
|---|---|
| `AppShell` | Authenticated layout wrapper with sidebar navigation |
| `AddLoanModal` | Loan creation form |
| `AddLendBorrowModal` | Lend/borrow creation form |
| `AddIncomeModal` | Income entry form |
| `AddGoalModal` | Goal creation form |
| `LoanCard` | Loan summary card |
| `LendBorrowCard` | Lend/borrow summary card |
| `GoalCard` | Goal progress card |
| `EMIScheduleTable` | Amortization schedule display with mark-paid |
| `PrepaymentSimulatorPanel` | Interactive prepayment simulation |
| `RepaymentLogModal` | Partial repayment recording |
| `ChangeInterestModal` | Variable interest rate change |
| `UpdateGoalProgressModal` | Log savings contribution |
| `ChatPanel` | Chat message interface |
| `NotificationBell` | In-app notification widget |
| `LoanSuggestionsWidget` | AI loan match suggestions |
| `MarkdownRenderer` | Rich markdown rendering for chatbot |
| `DataTable` | Reusable data table |

### State Management
- **Server State**: TanStack React Query (caching, refetching, mutations)
- **Auth State**: React Context (`AuthContext`)
- **Upload State**: React Context (`UploadContext`)
- **UI State**: Zustand store (`uiStore`)

### Custom Hooks
| Hook | Purpose |
|---|---|
| `useLoans` | Loan CRUD operations & query caching |
| `useLendBorrow` | Lend/borrow operations & enrichment |
| `useIncome` | Income CRUD operations |
| `useGoals` | Goal operations & progress logging |
| `useChat` | Chat session management & messaging |
| `useStatements` | Statement upload, processing & analysis |
| `useDashboardData` | Dashboard summary fetching |

### API Client
Centralized Axios instance (`apiClient.js`) with:
- Base URL configuration
- Cookie credentials (`withCredentials: true`)
- Automatic token refresh on 401 responses
- Request/response interceptors

---

## 20. API Endpoints Reference

### Summary Table

| Module | Base Path | Endpoints |
|---|---|---|
| Auth | `/api/auth` | 10 endpoints |
| Loans | `/api/loans` | 13 endpoints |
| Lend/Borrow | `/api/lendborrow` | 10 endpoints |
| Income | `/api/income` | 3 endpoints |
| Dashboard | `/api/dashboard` | 4 endpoints |
| Chat | `/api/chat` | 5 endpoints |
| Goals | `/api/goals` | 5 endpoints |
| Statements | `/api/statements` | 14 endpoints |
| Optimization | `/api/optimization` | 1 endpoint |
| Reminders | `/api/reminders` | 1 endpoint |
| Health | `/api/health` | 1 endpoint |
| **Total** | | **67 endpoints** |

---

## 21. Environment Configuration

```env
# ── Database (PostgreSQL) ──────────────────────────────────
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finpilot?schema=public"

# ── Redis ──────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── JWT Secrets ────────────────────────────────────────────
JWT_ACCESS_SECRET=         # Random secret for access tokens
JWT_REFRESH_SECRET=        # Random secret (used for generating refresh tokens)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ── LLM API ───────────────────────────────────────────────
LLM_API_KEY=               # Google Generative AI API key
LLM_PROVIDER=openai        # Provider label
EMBEDDING_MODEL=text-embedding-3-small

# ── Email (Brevo API & SMTP Relay) ─────────────────────────
BREVO_API_KEY=             # Brevo (Sendinblue) API key
BREVO_SENDER_EMAIL=        # Verified sender email
BREVO_SENDER_NAME=FinPilot
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# ── Encryption ────────────────────────────────────────────
FIELD_ENCRYPTION_KEY=      # 32 bytes (64 hex chars) for AES-256

# ── App Config ────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CHAT_RATE_LIMIT_PER_HOUR=20
CLIENT_URL=                # Frontend URL (for CORS & email links)
```

---

## 22. Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (with pgvector extension)
- **Redis** ≥ 6

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp ../.env.example .env
# Edit .env with your database, Redis, and API keys

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Enable pgvector extension (one-time)
node enable-vector.js

# Start development server
npm run dev          # API server on port 5000

# Start background worker (separate terminal)
npm run worker:dev   # BullMQ worker
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev          # Vite dev server on port 5173
```

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (backend or frontend) |
| `npm run worker:dev` | Start background worker with hot reload |
| `npx prisma studio` | Open Prisma Studio GUI |
| `npx prisma migrate dev` | Create & run new migration |
| `npm run build` | Build frontend for production |

---

<p align="center">
  <strong>Built with ❤️ by the FinPilot Team</strong>
</p>
