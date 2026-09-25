# DecisionFlow — Turn complex data into confident decisions

DecisionFlow is an enterprise-grade, production-ready **Decision Intelligence Platform** that converts fragmented real-world decision dilemmas into structured analytical models, combining:

* **Multi-Criteria Decision Analysis (MCDA)** with deterministic normalization
* **5×5 Quantitative Risk Register** ($Risk = Probability \times Impact$)
* **Explainable AI Recommendations** powered by Google Gemini 2.5 (`@google/genai`)
* **Real-Time Interactive Sensitivity Simulator** with ranking-stability indicators
* **Evidence & Strategic Assumption Tracking** with reliability metrics
* **Executive Decision Dossiers** with print-friendly PDF layouts
* **Supabase PostgreSQL Persistence** with Row-Level Security (RLS) data isolation
* **Strict Human Decision Authority**: The AI advises; the human retains final sign-off

---

## Architecture Overview

```
decisionflow/
├── client/                     # Frontend Application (React + Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/         # Reusable UI & Feature components
│   │   │   ├── analysis/       # RecommendationCard, ExplainabilityPanel, TradeOffPanel, SensitivitySimulator
│   │   │   ├── criteria/       # DecisionMatrixTable, WeightEditor
│   │   │   ├── dashboard/      # MetricCard, DecisionStatusBadge
│   │   │   ├── decisions/      # DecisionProgress, DecisionFilters
│   │   │   ├── layout/         # AppLayout, Sidebar, Topbar, PageContainer
│   │   │   ├── risks/          # RiskMatrix (5x5 Heatmap)
│   │   │   └── ui/             # Button, Input, Textarea, Select, Modal, Badge, Card, Spinner, EmptyState
│   │   ├── context/            # AuthContext (Supabase Auth + local session), ToastContext
│   │   ├── lib/                # api.ts (typed client), supabase.ts
│   │   ├── pages/              # 12 complete responsive application routes
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── App.tsx             # React Router routing configuration
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                     # Backend API & Calculation Engine (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── ai/                 # Gemini 2.5 Flash service, system prompts, explainable fallback
│   │   ├── calculations/       # MCDA engine, risk scoring, sensitivity scenarios, trade-off detection
│   │   ├── controllers/        # REST controllers for all decision operations
│   │   ├── middleware/         # Supabase JWT auth, ownership validation, error handler
│   │   ├── routes/             # Express API router mounted at /api
│   │   ├── services/           # Hybrid persistence adapter (Supabase PostgreSQL + local store fallback)
│   │   ├── validation/         # Strict Zod schemas for all client and AI boundary payloads
│   │   ├── types/              # Domain models
│   │   └── index.ts            # Server entrypoint with port fallback
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   └── migrations/
│       └── 20260925000000_initial_schema.sql # Complete PostgreSQL DDL with RLS, triggers, indexes
│
├── .env.example
├── package.json                # Root workspace orchestration
└── README.md
```

---

## Quickstart (Local Development)

### 1. Prerequisites
* Node.js v18+ (tested on v24.19.0)
* npm v9+

### 2. Install Dependencies
```bash
# In decisionflow root
npm --prefix server install
npm --prefix client install
```

### 3. Run Calculation Engine Unit Tests
```bash
npm run test:calculations
```
Verifies normalization formulas (higher-better, lower-better, target), weight normalization, risk scoring, and sensitivity rank swaps.

### 4. Run Development Servers
```bash
# Run server (port 5001)
npm --prefix server run dev

# In another terminal, run client (port 5173/5174)
npm --prefix client run dev
```

Visit `http://localhost:5174/` in your browser.

---

## Production Deployment & Supabase Setup

### 1. Database Setup (Supabase)
1. Open your Supabase Dashboard and navigate to the **SQL Editor**.
2. Run the migration script located at `supabase/migrations/20260925000000_initial_schema.sql`.
3. This creates all 11 tables (`profiles`, `decisions`, `alternatives`, `criteria`, `alternative_scores`, `evidence`, `assumptions`, `risks`, `analyses`, `sensitivity_runs`, `final_decisions`), enables Row Level Security (RLS) on all tables, and sets up automatic user profile triggers.

### 2. Environment Configuration
Create a `.env` file in the root directory (or in both `server/` and `client/`):

```env
# Server
PORT=5001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini AI (@google/genai)
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Frontend (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5001/api
```

---

## The Primary Analytical Lifecycle

1. **Register / Login**: Supabase Auth with automatic profile sync and session persistence.
2. **Dashboard**: Live KPIs (Total decisions, Active, Average confidence, High-risk decisions) and recent workspaces.
3. **Decision Creation Wizard**: State decision question, domain category, desired outcome, constraints, and decision style.
4. **Alternative Management**: Define 2–10 competing options with estimated costs, benefits, efforts, and durations.
5. **Criteria & Decision Matrix**: Assign evaluation metrics, optimize direction (Higher/Lower/Target), auto-normalize weights to 100%, and populate cell values.
6. **Evidence & Assumptions**: Register empirical evidence with reliability scores, separating facts from working hypotheses.
7. **Risk Register**: 5×5 Probability vs Impact heatmap ($Risk = P \times I$) with mitigation strategies.
8. **Run AI Analysis**: Deterministic calculation snapshot paired with Gemini 2.5 Flash explainable reasoning.
9. **Results & Sensitivity Simulator**: Review executive summary, 5 explainability pillars, trade-off matrix, and drag weight sliders to test ranking resilience.
10. **Final Human Decision**: Select final alternative, record human rationale, ratify decision status to `decided`.
11. **Executive Report**: Generate audit-ready, print-friendly decision dossiers.

---

## Security & Architectural Guarantees

* **Server-Side AI Boundary**: Gemini API keys never reach the browser. All AI prompts originate from Express backend.
* **Strict Validation**: All incoming requests and outgoing AI JSON responses are strictly validated with Zod schemas.
* **Row-Level Security (RLS)**: Users can only query, edit, or delete decisions and child records they own.
* **Deterministic Calculations**: AI never computes the numerical scores. The deterministic mathematical engine performs all score calculations and ranking, which the AI then explains.
* **Zero-Lockout Fallback**: If cloud Supabase credentials or Gemini keys are not configured, the platform functions seamlessly via local persistence and deterministic explainable reasoning.
