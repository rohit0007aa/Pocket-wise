# PocketWise AI — Small Budget. Big Dreams.

> **Stop Guessing. Start Saving.**  
> An AI-powered student expense and budget management web application built as a **Digital Data & AI Literacy** academic project at **JECRC University, Jaipur** (Department of Computer Science and Engineering, Session 2026–2027).  
> *Academic prototype — not officially endorsed by JECRC University.*

---

## Core Features

- **Premium Fintech Landing Page (`/`)**: Hero with interactive fictional demo chart, 3-card Student Money Challenge, 6-card interactive Bento Grid, Copilot preview, 3-step How It Works, and academic footer.
- **Instant Live Demo Mode (`/demo`)**: Zero-login exploration preloaded with clearly labeled fictional ₹5,000 student pocket money data (₹3,800 expenses, ₹1,200 remaining, 76% utilization), persisted in browser `localStorage` with a one-click **Reset Demo** button.
- **Authentication & Guided Onboarding (`/auth`, `/dashboard`)**: Student signup/login with scrypt-hashed passwords + HMAC-signed HTTP-only cookies (or Supabase Auth + RLS when configured), no bank/card/UPI PINs required.
- **Intelligent Dashboard & Budget Planner**: Safe-to-Spend daily limit, Month-End spending projection, rule-based Financial Health Score (0–100), category spending limits, and deduplicated Smart Alerts.
- **Functional Expense Tracker**: Full CRUD, search, category & date-range filters, confirmation dialogs, and CSV export.
- **AI Receipt Scanner**: Upload JPG/PNG/WebP bills to extract merchant, total, date, category, and items via server-side Gemini multimodal AI (with 3 clearly labeled fictional sample receipts for classroom demos). Images are processed in memory and not stored permanently.
- **PocketWise Copilot**: Conversational financial assistant sending only sanitized category/budget summaries to server-side Gemini AI, with transparent deterministic rule-based fallback when `GEMINI_API_KEY` is not set.
- **What-If Savings Simulator**: Real-time sliders for Food, Shopping, Entertainment, Transport, and Other Optional Expenses with hypothetical monthly/annual savings projections.
- **Roommate & Friend Expense Splitter**: Equal & custom splitting, WhatsApp/text summary copy, kept separate from personal expenses unless explicitly added.
- **Savings Goals & Challenges**: Personalized student goals, contribution history, No-Spend Day tracker, Save ₹500 milestone, and 7-Day Smart Spending challenge.
- **Analytics & Reports**: Interactive donut, weekly bar, multi-month comparison, budget-vs-actual, essential-vs-optional split, and CSV export.

---

## Quick Start (Local Development)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables (`.env.local`)

- `GEMINI_API_KEY` *(optional for local fallback; required for live Gemini Copilot & Vision Receipt Scanner)*: Server-only API key from Google AI Studio. Never prefix with `NEXT_PUBLIC_`.
- `GEMINI_MODEL` *(optional, defaults to `gemini-2.5-flash`)*.
- `SESSION_SECRET`: 32+ character random secret for signing session cookies.
- **Supabase Cloud *(optional)***: Leave `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` empty to use the built-in persistent local store (`.data/pocketwise-store.json`), or set them and execute `supabase/schema.sql` in your Supabase SQL Editor for Postgres + Row-Level Security.

---

## Verification Commands

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```
