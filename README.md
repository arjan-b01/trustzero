# TrustZero Escrow Engine

A secure escrow transaction platform built with Spring Boot, PostgreSQL, JWT Authentication, Role-Based Access Control, and an immutable audit ledger.

## Overview

TrustZero acts as a trusted intermediary between buyers and sellers.

Instead of sending money directly to the seller, the buyer deposits funds into an escrow account. The funds remain locked until the transaction is completed successfully or resolved through dispute management.

The system implements a strict Finite State Machine (FSM) to prevent illegal transaction state transitions and uses pessimistic database locking to ensure financial consistency during concurrent operations.

---

## Features

## Core Engineering Concepts Demonstrated
| Concept               | Implementation                                      |
|-----------------------|-----------------------------------------------------|
| ACID Transactions     | `@Transactional` with full rollback on any failure    |
| Concurrency Control   | `@Lock(PESSIMISTIC_WRITE)` on wallet rows             |
| Finite State Machine  | `EscrowStateValidator` blocks all illegal transitions |
| Immutable Audit Trail | Every balance change produces an AuditLog record    |

### Authentication & Authorization

* JWT-based authentication
* Role-based access control (BUYER, SELLER, ADMIN)
* Secure password hashing with BCrypt

### Wallet Management

* Wallet creation for every user
* Deposit functionality
* Secure balance tracking
* Pessimistic locking for monetary operations

### Escrow Engine

* Create escrow contracts
* Fund escrow transactions
* Release funds to sellers
* Open disputes
* Admin dispute resolution
* Finite State Machine validation

### Audit Ledger

* Immutable financial audit logs
* Transaction history tracking
* Wallet activity tracking

### API Documentation

* Swagger / OpenAPI integration

---

## Escrow State Machine

CREATED → FUNDED

FUNDED → RELEASED

FUNDED → DISPUTED

DISPUTED → RELEASED

DISPUTED → REFUNDED

Any other transition is automatically rejected.

---

## Tech Stack

* Java 17
* Spring Boot 
* Spring Security
* JWT
* PostgreSQL
* Spring Data JPA / Hibernate
* Maven
* Swagger / OpenAPI

---

## API Modules

* Authentication API
* Wallet API
* Escrow API
* Audit API

---

## Security Highlights

* JWT Authentication
* Environment-variable based secret management
* Role-based authorization
* Transaction management using @Transactional
* Pessimistic locking for financial consistency

---

## Running the Project

### Clone Repository

git clone <repository-url>

### Configure Environment Variables

JWT_SECRET=<your-base64-secret>

DB_PASSWORD=<your-password>

### Run Application

mvn clean install

mvn spring-boot:run

### Swagger UI

http://localhost:8080/swagger-ui/index.html

---

## Future Improvements

* Payment Gateway Integration
* Automated Escrow Expiry
* Email Notifications
* Docker Deployment
* CI/CD Pipeline
* Advanced Monitoring & Metrics

## Architecture Overview

```text
┌──────────────┐         ┌──────────────────────────────────────┐
│   REST Client │──JWT──▶ │           API Gateway Layer           │
└──────────────┘         │  (Spring Security + Role Enforcement) │
                         └──────────────┬───────────────────────┘
                                        │
              ┌─────────────────────────┼──────────────────────┐
              ▼                         ▼                      ▼
     ┌────────────────┐     ┌─────────────────────┐  ┌──────────────────┐
     │  WalletService  │     │   EscrowService      │  │  AuditLogService │
     │  (PESSIMISTIC_  │     │  (Finite State       │  │  (Immutable      │
     │   WRITE Lock)   │     │   Machine Enforcer)  │  │   Event Log)     │
     └────────┬───────┘     └──────────┬──────────┘  └────────┬─────────┘
              └─────────────────────────┼─────────────────────┘
                                        ▼
                              ┌─────────────────┐
                              │   PostgreSQL DB   │
                              │  (ACID, Row-Level │
                              │     Locking)      │
                              └─────────────────┘
```
