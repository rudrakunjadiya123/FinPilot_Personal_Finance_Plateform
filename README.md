# ✈️ FinPilot

> **AI-Powered Loan, Lending, Credit Card & Cash Flow Manager**  
> *Deterministic financial computation meets privacy-preserving AI intelligence.*

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68A063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📖 Description

**FinPilot** is a full-stack personal finance and debt management platform engineered to bring clarity, automation, and intelligent forecasting to your financial life.

Unlike generic budgeting apps, FinPilot focuses heavily on **formal and informal debt, repayment scheduling, cash flow visibility, and intelligent statement parsing**. It pairs deterministic math algorithms with an AI financial assistant built on Google Gemini.

### 🛡️ Core Philosophy: Strict Privacy & Deterministic Math
1. **Math Is Pure Code:** The LLM never calculates EMIs, amortizations, or balances. Calculations are executed deterministically by a dedicated JavaScript Computation Engine. The AI only interprets and explains the validated numbers.
2. **PII Masking & Privacy:** Sensitive personal identifiable information (names, emails, account numbers) is automatically tokenized and redacted before sending prompts to external AI APIs, and rehydrated upon delivery.
3. **Transparent AI:** A built-in *"Show What the AI Actually Sees"* UI toggle allows users to audit real-time data masking and tokenization.

---

## ✨ Features

### 🏦 1. Comprehensive Loans & EMI Management
- **All Loan Categories:** Track home, personal, auto, education, and custom institutional loans.
- **Dynamic Amortization Schedules:** Auto-generate month-by-month principal and interest repayment schedules.
- **Prepayment Simulator:** Simulate lump-sum prepayments and analyze tenure reduction vs. EMI reduction.
- **Payment Lifecycle:** Track EMI payment statuses (paid/unpaid) with single-click logging and balance recalculations.

### 🤝 2. Informal Lending & Borrowing (P2P Tracker)
- **Peer-to-Peer Ledgers:** Record money lent to or borrowed from family, friends, or colleagues.
- **Advanced Interest Calculations:** Support for zero-interest, simple interest, and compound interest with configurable compounding frequencies and historical rate adjustments.
- **Partial Repayments:** Log partial settlement transactions with audit histories per counterparty.
- **Automated Reminders:** Trigger polite, professional email reminders directly to borrowers.

### 📊 3. Cash Flow, Net Worth & Income Dashboard
- **Consolidated Health Metrics:** Real-time visibility into net worth, monthly cash flow surplus, debt-to-income (DTI) ratio, and total interest obligations.
- **Income Stream Management:** Log primary salaries and recurring or one-off secondary income streams.
- **Interactive Visualizations:** Historical net worth and debt distribution charts powered by Recharts.
- **Exportable Summaries:** Download PDF financial reports generated on the client via `jsPDF` and `html2canvas`.

### 🎯 4. Financial Goal Tracking
- **Dual Goal Modes:**
  - **Savings Goals:** Accumulate target amounts by a specific date (e.g., Emergency Fund, Vacation).
  - **Debt Payoff Goals:** Fast-track loan payoff targets with reverse-solved required monthly extra contributions.
- **Pace & Feasibility Indicators:** Cross-references required monthly allocations against your disposable cash surplus to flag goals as *Ahead*, *On Track*, or *Tight / At Risk*.

### 📄 5. Bank Statement Intelligence (PDF & CSV)
- **Multi-Format Ingestion:** Upload PDF or CSV bank statements for automated parsing and transaction extraction.
- **6-Tier Smart Categorization Pipeline:** Minimizes API cost and maximizes categorization accuracy:
  1. **Text Normalization:** Strips transaction IDs, reference hashes, and payment rail tokens.
  2. **Rule-Based Exact Matching:** Matches verified merchant regular expressions.
  3. **Fuzzy String Matching:** High-confidence merchant match via `fuzzysort`.
  4. **Semantic Embedding Similarity:** Cosine similarity search using `pgvector` against seeded merchant categories.
  5. **LLM Fallback:** Rare fallback to Google Gemini for ambiguous merchants.
  6. **Needs Review Queue:** Prompts user confirmation for unmatched merchants and persists custom rules.

### ⚡ 6. Debt Payoff Optimization Engine
- **Avalanche Strategy:** Prioritizes highest interest rate debts first to minimize total interest paid.
- **Snowball Strategy:** Prioritizes smallest balances first to build psychological momentum.
- **Waterfall Payment Simulation:** Demonstrates time and money saved by applying extra surplus monthly payments across debt pipelines.

### 🤖 7. Privacy-Preserving AI Financial Copilot
- **Structured Function Calling:** Ask natural language questions (*"What is my total interest liability?"*, *"Can I afford a ₹15,000 monthly car EMI?"*) answered by deterministic database functions.
- **pgvector RAG:** Unstructured semantic search over personal notes and loan terms using 768-dimensional Google Gemini embeddings (`text-embedding-004`).
- **In-Chat Lend/Borrow Extraction:** Express lending agreements in natural language; the copilot drafts the structured record for your confirmation.

### ⏰ 8. Asynchronous Background Worker & Notifications
- **BullMQ + Redis:** Reliable queue architecture running background jobs independently of API web traffic.
- **Automated Scanning:** Daily scans for upcoming EMI dues, overdue informal loans, and monthly goal progress.
- **Email Dispatch:** Responsive HTML email templates sent via Nodemailer and Brevo SMTP relay.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **State & Server Cache:** [TanStack React Query v5](https://tanstack.com/query) & [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/postcss`
- **Charts & Icons:** [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/)
- **Reporting & Markdown:** [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [React Markdown](https://github.com/remarkjs/react-markdown), [Remark GFM](https://github.com/remarkjs/remark-gfm)
- **HTTP Client:** [Axios](https://axios-http.com/) (configured with automatic cookie credentials and token refresh interceptors)

### Backend
- **Runtime & Framework:** [Node.js](https://nodejs.org/) (ESM / CommonJS) & [Express v5](https://expressjs.com/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) extension & [Prisma v7](https://www.prisma.io/)
- **In-Memory Cache & Queue:** [Redis](https://redis.io/) via `ioredis` & [BullMQ](https://bullmq.io/)
- **AI & Embeddings:** [Google Generative AI SDK](https://ai.google.dev/) (`@google/generative-ai`)
- **Document & Text Parsing:** `pdf-parse`, `csv-parse`, `multer`, `fuzzysort`
- **Email Delivery:** [Nodemailer](https://nodemailer.com/) with Brevo SMTP relay
- **Security & Utilities:** `bcryptjs`, `jsonwebtoken` (JWT via httpOnly cookies), `helmet`, `cors`, `zod`, `morgan`

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React 19 + Vite)                     │
│  Dashboard | Loans | Lend/Borrow | Goals | Statements | Chat    │
│  "Show what AI sees" real-time redaction inspector UI           │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API (httpOnly JWT Cookies)
┌───────────────────────────────▼─────────────────────────────────┐
│                   BACKEND (Node.js + Express 5)                 │
│                                                                 │
│  Auth & Token Service  ── JWT issue/verify, Redis token store   │
│  Core Domain API       ── Loans, EMIs, Lend/Borrow, Goals       │
│  Computation Engine    ── Pure JS deterministic math            │
│  Categorization Pipe   ── 6-tier pipeline (Rules, Fuzzy, RAG)   │
│  AI Orchestrator       ── Function Calling + pgvector RAG       │
│  PII Redaction Layer   ── Tokenizes sensitive data before LLM   │
│  Queue Producer        ── Enqueues scheduled BullMQ email jobs  │
└───────┬───────────────┬───────────────┬───────────────┬─────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌────────────────┐ ┌───────────────┐
│  PostgreSQL   │ │  Redis    │ │ BullMQ Worker  │ │ Google Gemini │
│  (Prisma ORM) │ │ (cache,   │ │ (processes     │ │ (Chatbot +    │
│  + pgvector   │ │  BullMQ,  │ │  reminder jobs │ │  Embeddings   │
│  extension    │ │  tokens)  │ │  via SMTP)     │ │  768-dim)     │
└───────────────┘ └───────────┘ └────────────────┘ └───────────────┘
```

---

## 🚀 How to Run

### 📋 Prerequisites
Before running FinPilot, ensure the following are installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher, v20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14+ recommended) with the [`pgvector`](https://github.com/pgvector/pgvector) extension installed
- [Redis](https://redis.io/) (v6+ running locally or hosted on Redis Cloud)
- A [Google Gemini API Key](https://aistudio.google.com/) for AI chat & embeddings
- (Optional) A [Brevo](https://www.brevo.com/) account for sending email notifications

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/FinPilot.git
cd FinPilot
```

---

### 2. Configure Backend Environment
Navigate to the `backend` folder and create a `.env` file (you can copy the example file from the project root):

```bash
cd backend
cp ../.env.example .env
```

Open `.env` and configure your credentials:

```ini
# ── Database (PostgreSQL with pgvector)
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/finpilot?schema=public"

# ── Redis
REDIS_URL="redis://localhost:6379"

# ── JWT Secrets
JWT_ACCESS_SECRET="your_super_secret_access_key"
JWT_REFRESH_SECRET="your_super_secret_refresh_key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# ── Google Gemini API
LLM_API_KEY="your_gemini_api_key"
LLM_PROVIDER="gemini"
EMBEDDING_MODEL="text-embedding-004"

# ── Email Service (Brevo / Nodemailer)
BREVO_API_KEY="your_brevo_api_key"
BREVO_SENDER_EMAIL="notifications@yourdomain.com"
BREVO_SENDER_NAME="FinPilot"
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"

# ── Encryption (32-byte hex for AES-256)
FIELD_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# ── App Settings
PORT=5000
NODE_ENV="development"
CHAT_RATE_LIMIT_PER_HOUR=20
```

> **Tip:** You can generate a valid 32-byte hex encryption key in Node.js using:  
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### 3. Install Dependencies & Setup Database

#### In `backend`:
```bash
# Install backend dependencies
npm install

# Run database migrations with Prisma
npx prisma migrate dev --name init

# Enable the pgvector extension and vector columns
node enable-vector.js

# (Optional) Seed initial missing embeddings if existing data is present
node sync-missing-embeddings.js
```

#### In `frontend`:
```bash
cd ../frontend
npm install
```

---

### 4. Run the Application

You will run three services: the **Backend API**, the **Background Worker**, and the **Frontend Client**.

#### A. Start the Backend API Server
```bash
cd backend
npm run dev
```
> Server starts on `http://localhost:5000`

#### B. Start the BullMQ Worker Process
In a separate terminal window:
```bash
cd backend
npm run worker:dev
```
*(Alternatively, set `RUN_WORKER_IN_WEB=true` in `backend/.env` to run the worker in the same Express process during local testing).*

#### C. Start the Frontend Development Server
In a separate terminal window:
```bash
cd frontend
npm run dev
```
> Frontend starts on `http://localhost:5173` (with `/api` automatically proxied to port `5000`).

---

### 5. Access the App
Open your browser and navigate to:
```text
http://localhost:5173
```
- Click **Get Started** or **Login** to create an account.
- Add your first loan, log income, upload a bank statement, or start a conversation with the AI Copilot.

---

## 📂 Project Directory Structure

```text
FinPilot/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma PostgreSQL & pgvector schema
│   ├── src/
│   │   ├── config/                 # Database, Redis & BullMQ queue configurations
│   │   ├── controllers/            # API Route controllers (Auth, Loans, Goals, Chat, etc.)
│   │   ├── middleware/             # Authentication & error handling middleware
│   │   ├── routes/                 # Express route definitions
│   │   ├── services/               # LLM, Categorization, RAG, Email & Goal services
│   │   ├── utils/                  # Computation engine, PII redaction & email templates
│   │   ├── validators/             # Zod input validation schemas
│   │   ├── app.js                  # Express app setup and middleware configuration
│   │   ├── server.js               # Main HTTP server entrypoint
│   │   └── worker.js               # Standalone BullMQ background worker
│   ├── enable-vector.js            # Script to enable PostgreSQL pgvector extension
│   └── package.json
├── frontend/
│   ├── public/                     # Static assets and icons
│   ├── src/
│   │   ├── components/             # Reusable UI components & modals
│   │   ├── context/                # Auth and Statement Upload contexts
│   │   ├── layouts/                # App navigation shell & sidebar
│   │   ├── pages/                  # Dashboard, Loans, Lend/Borrow, Goals, Statements, Chat
│   │   ├── routes/                 # App routing configuration
│   │   ├── services/               # Axios API client with interceptors
│   │   └── utils/                  # Formatting & currency helpers
│   ├── vite.config.js              # Vite configuration with backend proxy
│   └── package.json
├── srs_statement/                  # Product specifications & architectural docs
├── .env.example                    # Example environment variable template
├── .gitignore
└── README.md
```

---

## 🔒 Security & Privacy Notice
FinPilot is built with security-first engineering:
- **Zero Raw PII to AI:** User names, counterparty names, and emails are scrubbed before reaching the Google Gemini API.
- **Cookie-Based JWT:** Refresh and Access tokens use `httpOnly`, `sameSite`, and secure attributes to mitigate XSS and CSRF risks.
- **Rate-Limited Endpoints:** AI endpoints are rate-limited via Redis to prevent abuse.

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
