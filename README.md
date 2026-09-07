# Lawyer Marketplace

A full-stack **lawyer marketplace** and **practice SaaS** platform. Clients discover verified lawyers and book consultations. Lawyers run marketplace profiles plus plan-gated practice tools (cases, AI/RAG, documents, firm workspaces) billed per workspace with Stripe.

---

## Table of contents

- [Overview](#overview)
- [Repository structure](#repository-structure)
- [Tech stack](#tech-stack)
- [Roles & features](#roles--features)
- [Architecture](#architecture)
- [Subscription plans](#subscription-plans)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Stripe billing (local)](#stripe-billing-local)
- [API surface](#api-surface)
- [Frontend routes](#frontend-routes)
- [Backend domains](#backend-domains)
- [Scripts & jobs](#scripts--jobs)
- [Development notes](#development-notes)

---

## Overview

| Surface | What it is | Gated by plan? |
|---------|------------|----------------|
| **Marketplace** | Find lawyers, book CHAT/VIDEO sessions, wallet credits, reviews, disputes, KYC verification | No — always available |
| **Practice tools** | Cases, AI assistant, cross-exam, legal documents (RAG), planner, firm seats/roles | Yes — Free / Pro / Firm per **workspace** |
| **Public** | Marketing site, pricing page, lawyer search & profiles | No |

Billing is **workspace-scoped** (personal or firm). Marketplace activity (bookings, wallet, profile, verification) is intentionally **not** behind a subscription.

---

## Repository structure

```
lawyer-app/
├── frontend/                 # React + Vite SPA (port 5173)
│   ├── src/
│   │   ├── pages/            # public, auth, client, lawyer, admin
│   │   ├── components/       # UI, layout, billing, AI, notifications
│   │   ├── routes/           # React Router + guards
│   │   ├── store/            # Redux Toolkit slices
│   │   ├── services/         # Axios API clients
│   │   ├── billing/          # Plan catalog display helpers
│   │   ├── workspaces/       # Permission / nav catalog
│   │   └── hooks/, context/, theme.css
│   └── .env.example
├── backend/                  # Express + MongoDB API (port 5000)
│   ├── src/
│   │   ├── routes/, controllers/, services/, models/
│   │   ├── billing/          # Plans, entitlements, Stripe, meters
│   │   ├── workspaces/       # Permissions, firm membership
│   │   ├── notifications/    # Email + in-app + socket triggers
│   │   ├── services/ai/      # RAG, ingest, research / cross-exam
│   │   ├── socket/, jobs/, templates/, validators/
│   │   └── server.js
│   ├── scripts/              # RAG reindex, email preview, seeds
│   └── .env.example
├── .vscode/tasks.json        # One-click: backend + frontend + Stripe listen
└── README.md                 # This file
```

---

## Tech stack

### Frontend

- **React 19** + **Vite 7** + **React Router 7**
- **Redux Toolkit** (auth, profile, notifications, workspace)
- **Axios**, **Socket.IO client**
- **Tailwind CSS 3** with CSS-variable theming (light/dark)
- **Recharts**, **react-icons**, optional **Google OAuth** (`@react-oauth/google`)

### Backend

- **Node.js (ESM)** + **Express 4** + **Mongoose 8** / MongoDB
- **JWT** (access + refresh cookies), **bcrypt**, **Joi**, **Helmet**, rate limiting
- **Socket.IO** (session chat, video signaling, notifications)
- **Nodemailer** + HTML email templates
- **OpenAI** (chat + embeddings) + **Pinecone** (vector RAG)
- **Stripe** (Checkout, Customer Portal, webhooks)
- **Multer**, **pdf-parse**, **pdfkit**

---

## Roles & features

Roles: `CLIENT` | `LAWYER` | `ADMIN`.

### Client (`/client/*`)

- Dashboard overview
- Book / reschedule / cancel consultations
- Wallet & credit ledger
- Reviews & disputes
- Account settings (profile, security, notifications)
- Browse lawyers and open session chat (`/chat/:bookingId`)

### Lawyer (`/lawyer/*`)

**Marketplace**

- Profile, availability, bookings, earnings
- Verification document upload
- Reviews / reputation

**Practice (entitlement-gated)**

- Cases (workspace-scoped)
- AI Assistant & Cross-Exam Practice
- Legal documents (private RAG)
- Smart Planner

**Workspace & billing**

- Personal or firm workspace (members, roles, invites, firm profile)
- Billing: **Subscription**, **Usage**, **Invoices**

### Admin (`/admin/*`)

- Platform overview / analytics
- Workspaces, lawyers, users, bookings
- Verification review, disputes
- Case-law corpus (shared RAG)
- Subscriptions (list, detail, grant / force-free / reconcile)
- Plan catalog (read-only limits; prices owned in Stripe Dashboard)
- Platform settings

---

## Architecture

```
┌─────────────┐     REST + JWT      ┌──────────────┐
│   Frontend  │◄───────────────────►│   Backend    │
│  :5173      │     Socket.IO       │   :5000/api  │
└─────────────┘                     └──────┬───────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
               MongoDB               Pinecone               Stripe
            (app data)            (RAG vectors)          (Checkout /
                                                          webhooks)
```

- API is mounted at **`/api`**. Static uploads at `/uploads`. Health at `/health`.
- Practice requests are scoped by the lawyer’s **active workspace** (`X-Workspace-Id` where required).
- Entitlements are resolved centrally (`EntitlementService` + plan catalog), not ad-hoc plan string checks.
- Notifications: email templates + in-app records + realtime socket events.

---

## Subscription plans

| | **Free** | **Pro** | **Firm** |
|--|----------|---------|----------|
| Workspace type | Personal | Personal | Firm |
| Active cases | 5 | 50 | 200 |
| AI messages / month | 20 | 500 | 2,000 (shared) |
| Documents | 25 · 200 MB | 500 · 5 GB | 2,000 · 20 GB |
| Seats | 1 | 1 | 10 |
| Create firm | No | No | Yes |
| Display price | Free | ~$29/mo | ~$99/mo |

- New lawyers get a **14-day Pro trial** on their personal workspace (`BILLING_TRIAL_DAYS`).
- Past-due subscriptions get a grace period before practice tools lock (`BILLING_PAST_DUE_GRACE_DAYS`).
- Display prices are marketing defaults; **Stripe Dashboard prices** are authoritative for charges.

Lawyer billing UI:

| Route | Page |
|-------|------|
| `/lawyer/billing` | Redirects → Subscription |
| `/lawyer/billing/subscription` | Current plan + change plan |
| `/lawyer/billing/usage` | Quota meters |
| `/lawyer/billing/invoices` | Invoice table |

Public pricing: `/pricing`.

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **MongoDB** running locally or remotely
- **npm**
- Optional for full billing: [Stripe CLI](https://stripe.com/docs/stripe-cli), Stripe test-mode account
- Optional for AI/RAG: OpenAI API key, Pinecone index (cosine, **1536** dims for `text-embedding-3-small`)

---

## Local setup

```bash
# Clone
cd lawyer-app

# Backend
cd backend
cp .env.example .env
# Edit .env — at minimum MONGO_URI, JWT secrets, CLIENT_ORIGIN
npm install

# Frontend
cd ../frontend
cp .env.example .env
# Defaults point at http://localhost:5000
npm install
```

---

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`. Important groups:

| Group | Variables |
|-------|-----------|
| Core | `NODE_ENV`, `PORT` (default `5000`), `MONGO_URI`, `CLIENT_ORIGIN`, `APP_BASE_URL` |
| Auth | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_*_EXPIRES_IN`, `COOKIE_SECURE`, `COOKIE_SAME_SITE` |
| Email / OTP | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM*`, `OTP_*` (empty SMTP → emails logged to console) |
| Rate limit | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` |
| AI | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`, `AI_DAILY_REQUEST_LIMIT`, `ENCRYPTION_KEY` |
| RAG | `PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_CASE_LAW_NAMESPACE`, `RAG_*` |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_FIRM_MONTHLY`, `BILLING_TRIAL_DAYS`, `BILLING_PAST_DUE_GRACE_DAYS`, `BILLING_DISPLAY_*` |
| Jobs | `REMINDER_JOB_INTERVAL_MS`, `BILLING_JOB_INTERVAL_MS`, `BILLING_RECONCILE_ENABLED` |

Leaving Stripe keys empty is supported: marketplace and most practice flows still run; live Checkout is skipped and firm create can fall back to a manual Firm grant path.

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Backend origin (e.g. `http://localhost:5000`) — client appends `/api` |
| `VITE_SOCKET_URL` | Socket.IO origin |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google sign-in button |

Optional display overrides: `VITE_BILLING_DISPLAY_PRICE_PRO`, `VITE_BILLING_DISPLAY_PRICE_FIRM`.

---

## Running the app

### Option A — VS Code / Cursor task (recommended)

1. Ensure MongoDB is up and `.env` files are filled.
2. **Tasks: Run Build Task** (or **Run Task** → **Dev: Backend + Frontend + Stripe**).
3. Starts in parallel:
   - Backend → `http://localhost:5000`
   - Frontend → `http://localhost:5173`
   - `stripe listen --forward-to localhost:5000/api/billing/webhooks/stripe`

Defined in `.vscode/tasks.json`.

### Option B — Manual terminals

```bash
# Terminal 1 — API
cd backend && npm run dev

# Terminal 2 — SPA
cd frontend && npm run dev

# Terminal 3 — Stripe webhooks (billing only)
stripe login   # once
stripe listen --forward-to localhost:5000/api/billing/webhooks/stripe
```

Then open **http://localhost:5173**.

### Production-ish commands

```bash
cd backend && npm start
cd frontend && npm run build && npm run preview
```

---

## Stripe billing (local)

1. Create products/prices in **Stripe Test mode** for Pro and Firm monthly plans.
2. Set in `backend/.env`:
   - `STRIPE_SECRET_KEY` (`sk_test_…`)
   - `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_FIRM_MONTHLY` (`price_…`)
3. Run Stripe CLI listen (or the compound task). Copy the printed **`whsec_…`** into `STRIPE_WEBHOOK_SECRET` (it can change each CLI session unless you use a Dashboard endpoint secret).
4. Restart the backend after updating `.env`.
5. Exercise Checkout from **Billing → Subscription** or public **Pricing**.

Webhook route (raw body): `POST /api/billing/webhooks/stripe`.

Admin can also **grant** / **force-free** / **reconcile** subscriptions under `/admin/subscriptions`.

---

## API surface

Base URL: `http://localhost:5000/api`

| Prefix | Domain |
|--------|--------|
| `/auth` | Register, login, refresh, OTP, password flows, me |
| `/workspaces` | Personal/firm workspaces, members, roles, invites |
| `/cases` | Practice cases (workspace-scoped) |
| `/billing` | Catalog, entitlements, checkout, portal, webhook |
| `/lawyers` | Profiles, availability, earnings, verification |
| `/clients` | Client profile & related |
| `/bookings` | Consultations lifecycle |
| `/wallet` | Balance & ledger |
| `/ai` | Chat sessions, usage; `/ai/documents` private RAG |
| `/planner` | Calendar events |
| `/notifications` | In-app list + preferences |
| `/admin` | Users, lawyers, bookings, disputes, verification, settings |
| `/admin/rag` | Case-law ingest / management |
| `/admin/billing` | Catalog, subscriptions, grants |
| `/constants` | Shared enums (courts, specializations, …) |

Also: `GET /health`, static `/uploads/*`.

Frontend HTTP client: `frontend/src/services/apiClient.js` → ``${VITE_API_BASE}/api``.

---

## Frontend routes

| Area | Examples |
|------|----------|
| Public | `/`, `/marketing`, `/pricing`, `/lawyers`, `/lawyers/:id` |
| Auth | `/login`, `/register`, `/verify-email`, `/forgot-password` |
| Client | `/client/overview`, `/client/bookings`, `/client/wallet`, `/client/settings/*` |
| Lawyer | `/lawyer/overview`, `/lawyer/cases`, `/lawyer/ai`, `/lawyer/documents`, `/lawyer/billing/*`, `/lawyer/workspace/*`, `/lawyer/settings/*` |
| Admin | `/admin/overview`, `/admin/subscriptions`, `/admin/subscriptions/catalog`, `/admin/case-law`, … |
| Shared | `/chat/:bookingId` |

Guards: `ProtectedRoute` (role), `AuthRoute`, `VerifyEmailRoute`, `LandingRoute`, `RequirePermission` (workspace permissions).

---

## Backend domains

### Auth & security

- Email/password registration and login
- Access JWT + refresh token cookies
- Email verification OTP, password reset
- Rate limiting + Helmet

### Bookings & chat

- Status flow: booked → active → completed / expired / cancelled
- Session chat and video signaling over Socket.IO

### Wallet

- Client credits; ledger entries (top-up, spend, refund, earning, payout)
- Admin top-up support

### Verification (KYC trust)

- Lawyer document upload; admin approve/reject
- Separate from subscription gating

### Workspaces

- `PERSONAL` vs `FIRM`
- Activate workspace, members, custom roles, invites, leave/dissolve/transfer
- Permission catalog shared with the frontend

### Cases

- Workspace-scoped matters (not the shared case-law corpus)
- Notes, document attach, status, archive

### AI & RAG

- Modes: **research** and **cross-exam**
- Shared **case-law** corpus (admin) + **private** lawyer documents
- OpenAI embeddings → Pinecone retrieval → grounded answers
- Prep report / PDF generation where enabled

### Notifications

- Preference store (email / in-app)
- Triggers for auth, bookings, verification, reminders
- HTML email templates under `backend/src/templates/`

### Billing

- Plan catalog + hard meters (cases, AI, docs, storage, seats)
- Stripe Checkout & Customer Portal
- Webhook sync → `WorkspaceSubscription` / invoices / events
- Background reconcile & trial / past-due handling

---

## Scripts & jobs

### npm scripts

**Backend**

| Script | Command |
|--------|---------|
| `npm run dev` | Nodemon API server |
| `npm start` | Production `node src/server.js` |
| `npm run lint` | ESLint |
| `npm run rag:reindex-documents` | Reindex private legal documents into Pinecone |

**Frontend**

| Script | Command |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | ESLint |

### Background jobs (started with the API)

- **Reminder job** — booking / planner reminders (`REMINDER_JOB_INTERVAL_MS`)
- **Billing job** — trial expiry, past-due grace, Stripe reconcile (`BILLING_JOB_INTERVAL_MS`)

### Useful backend scripts (manual)

- `backend/scripts/reindex-legal-documents.js`
- `backend/scripts/send-all-email-templates.js`
- `backend/scripts/seedCaseLaw.js`, `debugRag.js`, `testRag.js`

---

## Development notes

- **Theming:** `frontend/src/theme.css` defines light/dark tokens (primary seagreen, secondary brown, accent gold). Toggle via UI / `ThemeContext`.
- **Sidebar:** Nested nav for Billing (and similar groups); Account settings remains a separate layout with flat Profile / Security / Notifications links.
- **Empty Stripe env:** Safe for local marketplace work; Checkout CTAs will report configuration missing until keys + prices + webhook secret are set.
- **Admin seed:** Server seeds an admin user on boot when configured by seeders — check console / seed utilities under `backend/src/seeders` for defaults.
- **CORS:** Set `CLIENT_ORIGIN` to the Vite origin (`http://localhost:5173`) in development.
- **Google OAuth:** Frontend-only wiring today; set `VITE_GOOGLE_CLIENT_ID` if you use the Google button (backend Google auth route is not the primary path).

---

## Deployment (Render)

Deploy **frontend and backend both on Render** — no Vercel.

| Service | Render type | Config |
|---------|-------------|--------|
| API | Web Service (Docker) | [`backend/Dockerfile`](./backend/Dockerfile) |
| UI | Static Site | Vite build → `frontend/dist` |
| Blueprint | Both | [`render.yaml`](./render.yaml) |

Step-by-step: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## Quick start checklist

1. [ ] MongoDB running  
2. [ ] `backend/.env` from `.env.example` (JWT + `MONGO_URI` + `CLIENT_ORIGIN`)  
3. [ ] `frontend/.env` from `.env.example`  
4. [ ] `npm install` in `backend` and `frontend`  
5. [ ] Run **Dev: Backend + Frontend + Stripe** (or three terminals)  
6. [ ] Optional: OpenAI + Pinecone for AI/RAG  
7. [ ] Optional: Stripe test keys + `whsec` from CLI for Checkout  

Open **http://localhost:5173** and register as a lawyer or client to explore.

---

## License

Private / proprietary unless otherwise stated by the repository owners.
