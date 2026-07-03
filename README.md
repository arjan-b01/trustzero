# TrustZero — AI-Powered Escrow Engine

TrustZero is a secure escrow platform that combines traditional financial transaction guarantees with AI-assisted dispute resolution.

Instead of relying solely on manual administrators to resolve disputes, TrustZero introduces a three-agent AI arbitration pipeline that can automatically resolve straightforward disputes while escalating uncertain cases to a human administrator.

Built using Java, Spring Boot, PostgreSQL, JWT Authentication, Finite State Machines, ACID transactions, pessimistic locking, and Fireworks AI.

---

# Features

## Core Engineering Concepts

| Concept | Implementation |
|----------|----------------|
| ACID Transactions | `@Transactional` with rollback on failure |
| Concurrency Control | `@Lock(PESSIMISTIC_WRITE)` for wallet consistency |
| Finite State Machine | Prevents illegal escrow state transitions |
| Immutable Audit Trail | Every financial and AI decision is recorded |
| Platform Commission | Automatic commission deduction during funding |
| AI Arbitration | Three-agent LLM workflow for dispute resolution |

---

# Authentication & Authorization

- JWT Authentication
- BCrypt password hashing
- Role-Based Access Control
    - BUYER
    - SELLER
    - ADMIN

---

# Wallet Engine

- Automatic wallet creation
- Secure deposits
- Balance management
- Pessimistic row locking
- Immutable financial ledger

---

# Escrow Engine

- Create escrow contracts
- Fund transactions
- Automatic platform commission collection
- Release funds
- Open disputes
- Manual admin resolution
- AI-powered dispute resolution
- Finite State Machine validation

---

# AI Arbitration System

TrustZero introduces an explainable multi-agent arbitration pipeline.

When an escrow enters the **DISPUTED** state:

```
Buyer Claim
        │
        ▼
Buyer Advocate AI
        │
        ▼
Seller Advocate AI
        │
        ▼
Neutral Arbitrator AI
        │
        ▼
Deterministic Java Confidence Engine
        │
        ├──────────────► High Confidence
        │                  │
        │                  ▼
        │          Auto Resolve Escrow
        │
        ▼
Low Confidence
        │
        ▼
Escalate to Admin
```

### Buyer Advocate

Generates arguments supporting a refund.

### Seller Advocate

Generates arguments supporting releasing funds.

### Neutral Arbitrator

Evaluates both arguments together with dispute details and produces:

- verdict
- reasoning
- structured JSON response

### Confidence Engine

Instead of trusting the LLM's confidence directly, TrustZero calculates a deterministic confidence score in Java based on predefined business rules before deciding whether to auto-execute or escalate.

---

# Platform Commission

Every funded escrow automatically deducts a configurable platform commission.

```
Buyer
  │
  ▼
₹1000
  │
  ├────────► Platform Wallet (3%)
  │
  ▼
₹970 Locked in Escrow
```

The original contract amount is preserved while the escrow stores the actual locked amount for future release or refund.

---

# Live AI Arbitration Visualizer

TrustZero includes a live frontend visualizer demonstrating the AI arbitration process.

The visualizer displays:

- Buyer Advocate argument
- Seller Advocate argument
- Arbitrator reasoning
- Confidence score
- Final verdict
- Escrow state transition
- Audit log update

making the entire decision process transparent and explainable.

---

# Escrow State Machine

```
CREATED
    │
    ▼
FUNDED
   ├────────────► RELEASED
   │
   ▼
DISPUTED
   ├────────────► RELEASED
   │
   └────────────► REFUNDED
```

Illegal transitions are rejected automatically.

---

# Audit System

Every important system event is permanently recorded.

Examples include:

- Deposits
- Escrow funding
- Platform commission
- Fund releases
- Refunds
- AI decisions
- Admin overrides

---

# Tech Stack

- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- PostgreSQL
- JWT
- Maven
- Swagger / OpenAPI
- Fireworks AI API

---

# API Modules

- Authentication API
- Wallet API
- Escrow API
- Dispute API
- AI Arbitration API
- Audit API

---

# Security Highlights

- JWT Authentication
- BCrypt password hashing
- Environment variable secret management
- Stateless authentication
- Role-based authorization
- ACID transactions
- Pessimistic database locking

---

# Running the Project

## Clone Repository

```bash
git clone https://github.com/arjan-b01/trustzero.git
```

## Configure Environment Variables

```text
JWT_SECRET=...

DB_URL=...

DB_USERNAME=...

DB_PASSWORD=...

FIREWORKS_API_KEY=...
```

## Run

```bash
mvn clean install

mvn spring-boot:run
```

## Swagger

```
http://localhost:8080/swagger-ui/index.html
```

---

# Architecture Overview

```
                    JWT Authentication
                           │
                           ▼
                  Spring Security Layer
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   Wallet Service     Escrow Service    Audit Service
         │                 │
         │                 ▼
         │         Dispute Service
         │                 │
         │                 ▼
         │        AI Arbitration Engine
         │                 │
         │      ┌──────────┼──────────┐
         │      ▼          ▼          ▼
         │ Buyer AI   Seller AI   Arbitrator AI
         │                 │
         └─────────────────┼─────────────────┘
                           ▼
                     PostgreSQL
```

---

# Future Roadmap

- Vision-based evidence analysis
- PDF contract understanding
- OCR for receipts and invoices
- AI-assisted evidence validation
- Multi-party evidence submission
- Payment gateway integration
- Email notifications
- Docker & Kubernetes deployment
- CI/CD pipeline
- Monitoring & Observability
