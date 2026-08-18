# TrustZero — AI-Powered Escrow Engine

> **Every dispute, settled transparently.** TrustZero is a full-stack escrow platform that pairs a traditional financial escrow engine (wallets, funding, release, audits, platform commission) with an **explainable multi-agent AI arbitration pipeline** — so straightforward disputes are auto-resolved with a deterministic confidence check, while uncertain ones are escalated to a human admin.

![Java 17](https://img.shields.io/badge/Java-17-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.6-6DB33F?logo=spring&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens&logoColor=white)

---

## What is this, in plain words?

TrustZero is an **escrow platform** — a digital middleman that makes online payments between strangers safe:

1. **Buyers** pay into a protected account (the escrow) before the work begins.
2. **Sellers** receive the money only after they deliver what was agreed.
3. If the two sides disagree, **AI agents** handle it in a **four-layer review**: an **Evidence Analyst** inspects the proof, a **Buyer Advocate** argues for a refund, a **Seller Advocate** argues for releasing the payment, and a **Neutral Arbitrator** rules on the dispute — either settling it automatically or passing it to a human admin to decide.

The goal: you shouldn't have to blindly trust a stranger on the internet — and when there is a dispute, you can see exactly why the system ruled the way it did.

---

## Features

### Financial Escrow Engine
- **JWT authentication** with BCrypt password hashing and role-based access control (`BUYER`, `SELLER`, `ADMIN`)
- **Wallet engine** with automatic wallet creation, deposits, balance management, and **pessimistic row locking** (`PESSIMISTIC_WRITE`) for concurrency-safe balance updates
- **Escrow lifecycle** driven by a **finite state machine** that rejects illegal state transitions
- **Automatic platform commission** (default `3%`) collected at funding time
- **Immutable audit trail** — every financial and AI decision is recorded

### AI Arbitration Pipeline (Explainable)
When an escrow enters `DISPUTED`, a four-agent LLM pipeline runs and **streams live to the frontend** over Server-Sent Events:

| Agent | Role | Purpose |
|-------|------|---------|
| **0. Evidence Analyst** | Fetch + evaluate | Fetches evidence URLs, summarizes image/video/PDF analyses from uploaded files, and produces a structured evidence report (`STRONG` / `MODERATE` / `WEAK` / `NONE`) |
| **1. Buyer Advocate** | Argue for refund | Generates a detailed argument citing the submitted evidence |
| **2. Seller Advocate** | Argue for release | Generates a detailed counter-argument citing the same evidence |
| **3. Neutral Arbitrator** | Decide | Evaluates the evidence report + both arguments and outputs a structured verdict with reasoning |

### Deterministic Java Confidence Engine
The LLM's verdict is **never trusted blindly**. A deterministic score is computed in Java from five business rules before the system acts:

```
        0.30  baseline
      + 0.25  strong documentary evidence        (or +0.15 if moderate)
      + 0.15  clear, unambiguous case
      + 0.15  evidence corroborates the verdict
      + 0.10  both advocates addressed the same facts
      + 0.05  arbitrator reasoning is free of hedging
      ───────
     max 0.95  (never claim 100% certainty)

     ≥ 0.75  → AUTO-EXECUTE  (escrow released/refunded via Spring FSM)
     < 0.75  → ESCALATE      (flagged for human admin override)
```

### Live Arbitration Visualizer
A dedicated frontend page shows the whole decision process in real time — the buyer and seller arguments type out as they stream in, the neutral arbitrator renders its reasoning, and the final confidence score determines whether the escrow is **auto-executed** or **escalated to admin** — making the AI's decision completely transparent.

### 🧾 Dispute & Evidence Management
- Structured dispute opening with agreed delivery terms
- Seller response submission
- Evidence URL fetching (`EvidenceFetcher` extracts web-page text)
- **Image evidence upload** analyzed by a **vision-language model** (`VisionAnalyzer`)
- Evidence index stored per dispute for audit and re-analysis

---

## System Architecture

```
┌─────────────────────────── FRONTEND (React + Vite) ───────────────────────────┐
│                                                                               │
│  Landing / Auth  →  Dashboard  →  Escrow/Dispute lists  →  Details pages      │
│                                                                               │
│  AI Arbitration Visualizer ◄──── SSE stream (Server-Sent Events)              │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │  REST + JWT (Bearer / ?token=)
┌───────────────────────────────────▼───────────────────────────────────────────┐
│                            BACKEND (Spring Boot)                              │
│                                                                               │
│   Spring Security (JWT)  ──►  RBAC (BUYER / SELLER / ADMIN)                   │
│                                                                               │
│   ┌──────────────┬──────────────┬──────────────┬──────────────┐               │
│   │ Wallet       │ Escrow (FSM) │ Dispute &    │ Audit        │               │
│   │ Service      │ Service      │ Evidence     │ Service      │               │
│   └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘               │
│          │              │              │              │                       │
│          ▼              ▼              ▼              ▼                       │
│   ┌─────────────────────── AI Arbitration Engine (Reactive SSE) ───────────┐  │
│   │  Agent 0           Agent 1,2         Agent 3                            │  │
│   │  Evidence Analyst  Advocates         Neutral Arbitrator                 │  │
│   │        └────────── ALL via Fireworks AI chat completions ──────────┘   │  │
│   │                    (Vision model for image evidence)                     │  │
│   └──────────────────────────┬───────────────────────────────────────────────┘  │
│                              ▼                                                  │
│                    Deterministic Confidence Engine                              │
│                    ┌───────────────────────┐   ≥ 0.75 → auto-execute via FSM    │
│                    └───────────────────────┘   < 0.75 → escalate to admin       │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    ▼
                           PostgreSQL database
                     (escrow, disputes, wallets, audit)
```

### Project Structure

```
trustzero/
├── backend/                          # Spring Boot application (Java 17, Maven)
│   ├── src/main/java/com/escrow/engine/
│   │   ├── arbitration/              # AI arbitration pipeline + LLM clients
│   │   │   ├── client/               #   FireworksClient, VisionAnalyzer, EvidenceFetcher
│   │   │   ├── controller/           #   SSE streaming endpoint
│   │   │   └── service/              #   4-agent orchestration + confidence engine
│   │   ├── audit/                    # Immutable audit log
│   │   ├── auth/                     # Register / login / JWT issuance
│   │   ├── common/                   # OpenAPI, global exception handling
│   │   ├── dispute/                  # Dispute records + evidence upload
│   │   ├── escrow/                   # Escrow FSM + release/refund/resolve
│   │   ├── payment/                  # Mock payment provider
│   │   ├── security/                 # JWT filter, user details, security config
│   │   ├── user/                     # User entity + roles
│   │   ├── wallet/                   # Wallet, deposits, pessimistic locking
│   │   └── HealthController.java
│   └── pom.xml
│
├── frontend/                         # React SPA (Vite + Tailwind CSS 4)
│   └── src/
│       ├── pages/                    # Landing, auth, dashboard, wallet, escrows, disputes
│       ├── components/               # Layouts, protected routes
│       ├── services/                 # Axios API layer, auth token handling
│       ├── context/                  # Auth context
│       └── routes/AppRoutes.jsx      # Client-side routing
│
├── backend/Dockerfile                # Multi-stage Maven build → runnable JAR
└── render.yaml                       # Render deployment manifest (backend)
```

---

## Tech Stack

**Backend**
- Java 17 · Spring Boot 4 · Spring Web / WebFlux · Spring Data JPA (Hibernate) · Spring Security
- PostgreSQL · JWT (jjwt) · Lombok · Swagger / OpenAPI (springdoc) · Reactor (SSE streaming)
- Fireworks AI chat completions + vision language model

**Frontend**
- React 19 · Vite 8 · Tailwind CSS 4 · React Router 7 · TanStack Query · Framer Motion · Axios · react-hook-form · react-hot-toast · lucide-react · oxlint

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| JDK | 17+ | Required by the backend (Maven toolchain) |
| Maven | 3.9+ | Or use the included `./mvnw` wrapper |
| Node.js | ≥ 20 | For the frontend |
| PostgreSQL | 14+ | Or use the Docker image below |

### 1. Clone the repository

```bash
git clone https://github.com/arjan-b01/trustzero.git
cd trustzero
```

### 2. Configure environment variables

Create `backend/.env` (or export them in your shell) — **never commit secrets**:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ | — | Secret used to sign JWT tokens (use a long random string) |
| `DB_URL` | ✅ | `jdbc:postgresql://localhost:5432/escrow_db` | PostgreSQL JDBC URL |
| `DB_USERNAME` | ✅ | `postgres` | Database user |
| `DB_PASSWORD` | ✅ | `password` | Database password |
| `FIREWORKS_API_KEY` | ✅ | — | Fireworks AI API key (used by all four arbitration agents + vision) |
| `VITE_API_URL` | * | `/api` | Frontend API base URL (set to the deployed backend URL in production) |

### 3. Run the backend

```bash
cd backend

# Option A — using the Maven wrapper
JWT_SECRET=... DB_URL=... DB_USERNAME=... DB_PASSWORD=... FIREWORKS_API_KEY=... \
  ./mvnw spring-boot:run

# Option B — build the JAR
./mvnw clean package
java -jar target/engine-0.0.1-SNAPSHOT.jar
```

The API starts at `http://localhost:8080`. Swagger UI: http://localhost:8080/swagger-ui/index.html

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`. The Vite dev server proxies `/api` → `http://localhost:8080`, so no extra config is needed for local development.

### 5. Run with Docker (backend only)

```bash
cd backend
docker build -t trustzero-backend .
docker run -p 8080:8080 \
  -e JWT_SECRET=... \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/escrow_db \
  -e DB_USERNAME=... -e DB_PASSWORD=... \
  -e FIREWORKS_API_KEY=... \
  trustzero-backend
```

---

## API Overview

All endpoints (except auth/health) require a JWT via `Authorization: Bearer <token>` — or `?token=` for the SSE stream (browser `EventSource` cannot set headers).

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/auth/register` | public | Create a user (BUYER / SELLER / ADMIN) |
| `POST` | `/api/auth/login` | public | Login, returns JWT |
| `GET`  | `/api/health` | public | Health check |
| `GET`  | `/api/wallet/me` | authed | Current user's wallet |
| `POST` | `/api/wallet/deposit` | authed | Deposit funds |
| `POST` | `/api/escrow` | BUYER | Create escrow contract |
| `GET`  | `/api/escrow` | authed | List escrows |
| `GET`  | `/api/escrow/{id}` | authed | Escrow details |
| `POST` | `/api/escrow/{id}/fund` | BUYER | Fund escrow (commission deducted) |
| `POST` | `/api/escrow/{id}/release` | BUYER | Release funds to seller |
| `POST` | `/api/escrow/{id}/dispute` | BUYER | Open a dispute |
| `POST` | `/api/escrow/{id}/dispute/seller-response` | SELLER | Submit seller response + evidence URL |
| `GET`  | `/api/escrow/{id}/dispute` | authed | Dispute record (AI results included) |
| `POST` | `/api/escrow/{id}/resolve` | ADMIN | Manual resolution |
| `POST` | `/api/evidence/escrow/{escrowId}/upload` | authed | Upload evidence file (image) |
| `GET`  | `/api/evidence/escrow/{escrowId}` | authed | List evidence for a dispute |
| `GET`  | `/api/evidence/files/{filename}` | public | Download evidence file |
| `GET` / `POST` | `/api/escrow/{id}/arbitrate/stream` | ADMIN | **SSE stream** — runs the full AI pipeline live |
| `GET`  | `/api/audit/escrow/{escrowId}` | authed | Audit trail for an escrow |
| `GET`  | `/api/audit/wallet/{walletId}` | authed | Audit trail for a wallet |

### Triggering AI Arbitration

Arbitration runs live over **Server-Sent Events**. From the browser:

```js
const es = new EventSource(`/api/escrow/${escrowId}/arbitrate/stream?token=${jwt}`);

es.onmessage = (e) => {
  const evt = JSON.parse(e.data);   // { type, agent?, message, data }
  // types: progress | agent_start | agent_complete | verdict | error
};
```

Events are emitted as each agent finishes, culminating in a `verdict` event containing the verdict, reasoning, and confidence score. The frontend visualizer renders these in real time.

---

## Escrow State Machine

```
        ┌─────────┐
        │ CREATED │
        └────┬────┘
             │ fund (+3% commission)
             ▼
        ┌─────────┐
        │ FUNDED  │
        └────┬────┘
        ┌────┴────┐
     release     dispute
        │          │
        ▼          ▼
   ┌─────────┐  ┌──────────┐
   │ RELEASED│  │ DISPUTED │
   └─────────┘  └────┬─────┘
                     │ AI arbitration / admin resolve
                ┌────┴────┐
                ▼         ▼
           ┌─────────┐ ┌─────────┐
           │ RELEASED│ │ REFUNDED│
           └─────────┘ └─────────┘
```

Illegal transitions (e.g. releasing an un-funded escrow) are rejected by the FSM validator (`EscrowStateValidator`).

---

## Deployment (Render)

A minimal `render.yaml` for the backend is included:

```yaml
services:
  - type: web
    name: trustzero-backend
    env: docker
    rootDir: backend
    healthCheckPath: /api/health
    healthCheckGracePeriodSeconds: 300
```

**On Render, remember to:**
1. Set all environment variables from the table above (`JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `FIREWORKS_API_KEY`).
2. Use a managed PostgreSQL instance for `DB_URL`.
3. Deploy the frontend build (`npm run build`) to any static host and set `VITE_API_URL` to the backend URL.

---

## Security Model

- **JWT authentication** — stateless sessions, expiry + signature validation (`JwtUtil`)
- **BCrypt password hashing** for all stored credentials
- **Role-based access control** — arbitration and resolution are ADMIN-only
- **Concurrency safety** — `PESSIMISTIC_WRITE` row locks on wallets prevent double-spend
- **Transactional integrity** — arbitration writes and fund movement happen inside a single `TransactionTemplate` boundary
- **Secrets via environment variables** — no credentials in the repository

---

## Engineering Highlights

| Concept | Implementation |
|---------|----------------|
| ACID transactions | `@Transactional` + programmatic `TransactionTemplate` |
| Concurrency control | `@Lock(PESSIMISTIC_WRITE)` on wallet rows |
| Finite state machine | Guards every escrow transition |
| Immutable audit trail | `AuditLog` rows for deposits, commissions, releases, AI decisions, admin overrides |
| Explainable AI | Deterministic Java confidence score over raw LLM output |
| Real-time UX | Reactive SSE (`Sinks.Many` → `Flux`) streaming agent output to the visualizer |
| Vision analysis | Image evidence analyzed by a vision-language model before text agents see it |

---

## Roadmap

- [ ] OCR for receipts & invoices
- [ ] PDF contract understanding
- [ ] AI-assisted evidence validation (multi-source cross-checking)
- [ ] Real payment gateway integration (Razorpay / Stripe)
- [ ] Email notifications & dispute deadlines
- [ ] Monitoring & observability (metrics, tracing)
- [ ] CI/CD pipeline + automated tests for the arbitration engine

---
