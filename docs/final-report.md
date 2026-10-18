# ═══════════════════════════════════════════════════════════════
# Production Environment — LOCAL TEST VALUES
# For the university's real server, regenerate all secrets.
# NEVER commit this file to git.
# ═══════════════════════════════════════════════════════════════

# --- Postgres ---
POSTGRES_USER=sacco
POSTGRES_PASSWORD=SaccoProdDev2026Pg
POSTGRES_DB=sacco_db

# --- Redis ---
REDIS_PASSWORD=SaccoProdDev2026Redis

# --- JWT ---
JWT_SECRET=Zk8mYpQxNvB7wR2tE5uA9cF3hJ6kL1mN4pS7vX0zD8gH2jK5nQ9rT3wY6bV1cF4hJ
JWT_EXPIRES_IN=12h

# --- Frontend ---
NEXT_PUBLIC_API_URL=http://localhost/api/v1
CORS_ORIGIN=http://localhost

# --- Backup Encryption ---
BACKUP_ENCRYPTION_PASSWORD=SaccoBackup2026Encrypt# Injibara University Staff Savings and Credit Management System
## Digital SACCO / Microfinance Platform

**Industrial Project I — Final Report**

**Department of Information Systems**
**Injibara University**
**Submission Date:** 28/01/2019 E.C. (2026 G.C.)

---

### Team Members

| # | Name | ID |
|---|---|---|
| 1 | Amare Agerneh | 1500596 |
| 2 | Gebrehana Desalegn | 1500826 |
| 3 | Basleal Getaneh | 1500635 |
| 4 | Yechale Embiale | 1501171 |
| 5 | Simachew Alene | 1501075 |
| 6 | Addisu Fenta | 1500551 |

**Advisor:** [Advisor Name]
**Repository:** https://github.com/yechaleembiale2-boop/sacco

---

## Abstract

The Injibara University Staff Savings and Credit Cooperative (SACCO) currently manages member savings, loans, repayments, and interest calculations using paper ledgers and spreadsheets. This manual approach leads to calculation errors, disputes over balances, delayed loan approvals, weak audit trails, and no self-service access for members.

This project designed and implemented a **secure web-based digital SACCO platform** to replace the manual process. The system includes member registration with KYC records, multi-role authentication with segregation of duties, savings account management, a full loan lifecycle (application, approval, disbursement, repayment), a **double-entry ledger** with immutable transactions, a monthly payroll deduction file generator, a member self-service portal, and comprehensive financial reports.

The platform was built using **Next.js 16** (frontend) and **NestJS 12** (backend), with **PostgreSQL 16** as the database and **Redis 7** for caching. It features a **JWT-based authentication system** with seven distinct roles, a **tamper-evident audit log**, and **automated test coverage** (16 tests) proving the correctness of financial calculations and the ledger balance invariant.

The system has been deployed to a **production-ready Docker environment** with nginx as the reverse proxy, TLS termination, encrypted database backups, and a documented deployment procedure.

The expected impact includes eliminating calculation errors, speeding up loan decisions, giving members transparent self-service access, making audits straightforward, and giving the cooperative committee real-time financial reports.

**Keywords:** SACCO, microfinance, digital ledger, double-entry accounting, web application, NestJS, PostgreSQL, Ethiopia

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Literature Review](#2-literature-review)
3. [System Analysis & Design](#3-system-analysis--design)
4. [Implementation](#4-implementation)
5. [Testing & Results](#5-testing--results)
6. [Deployment](#6-deployment)
7. [Conclusion & Future Work](#7-conclusion--future-work)
8. [References](#references)
9. [Appendices](#appendices)

---

## 1. Introduction

### 1.1 Background

Injibara University employs over 800 staff members. A portion of these staff voluntarily participate in a staff savings and credit cooperative (SACCO) — a member-owned financial institution where they contribute monthly savings and can borrow money at rates lower than commercial banks.

Currently, this SACCO operates entirely on **paper ledgers, Excel spreadsheets, and manual record-keeping**. The cooperative's chairperson, accountant, and cashier manage the books by hand, while members must physically visit the SACCO office to check balances or apply for loans.

### 1.2 Problem Statement

The manual SACCO operation introduces several problems:

1. **Calculation errors** — interest, penalties, and balances are computed by hand, leading to discrepancies and disputes.
2. **Long approval delays** — loan applications pass through multiple manual stages, often taking days or weeks.
3. **Weak audit trails** — paper records are difficult to trace, easy to lose, and impossible to verify historically.
4. **No self-service** — members cannot check their balances, loan status, or repayment schedule without visiting the office.
5. **No timely reporting** — the committee lacks real-time visibility into the SACCO's financial position (portfolio at risk, defaulters, income).
6. **Poor segregation of duties** — one person often enters and approves transactions, violating standard internal controls.

### 1.3 Objectives

**General objective:** Design and implement a secure, web-based Digital SACCO platform to automate the SACCO's financial operations.

**Specific objectives:**

1. Build a **double-entry ledger** with immutable transactions to guarantee financial integrity.
2. Implement **multi-role authentication** with segregation of duties.
3. Automate **savings, loan, and repayment** workflows.
4. Provide **real-time reports** (trial balance, portfolio at risk, defaulters, income).
5. Generate **monthly payroll deduction files** for the finance office.
6. Offer **self-service member access** to balances, statements, and loan status.
7. Support **Amharic/English** with **Ethiopian calendar**.

### 1.4 Scope

**In scope:**
- Member registration, KYC, and account opening.
- Savings (mandatory, voluntary, share capital).
- Loans (apply, approve, disburse, repay, early settlement).
- Interest and penalty calculations.
- Double-entry ledger.
- Reports and Excel export.
- Payroll deduction file (CSV/Excel).
- Member portal (dashboard, statements, loan details).
- Amharic/English UI with Ethiopian calendar.
- Production deployment (Docker, nginx, backup scripts).

**Out of scope:**
- Mobile app (planned for Phase 2).
- SMS/email notifications (backend infrastructure ready but not connected).
- Full MFA (schema ready but flow not implemented).
- Integration with banking APIs.

### 1.5 Methodology

**Agile (Scrum)** with weekly sprints. Every business rule was validated through iterative demos with the cooperative committee. **DevOps practices** with Docker, GitHub Actions, and automated testing ensured continuous quality.

---

## 2. Literature Review

### 2.1 SACCOs in Ethiopia

SACCOs are member-owned financial cooperatives regulated by the **Ethiopian Cooperative Agency**. They operate on a not-for-profit basis, providing savings and credit services to their members. Common loan types include emergency, education, housing, and business loans.

### 2.2 Digital Microfinance Platforms

Existing digital SACCO solutions exist in East Africa (e.g., **Kwara** in Kenya, **M-Kopa** for consumer credit, **Mambu** as a banking core). These platforms demonstrate that digital SACCO management is both feasible and impactful, but most are priced for commercial banks, not small university cooperatives.

### 2.3 Open Source Alternatives

Open source accounting systems like **GnuCash**, **Odoo Accounting**, and **ERPNext** could theoretically be adapted for a SACCO. However, none include SACCO-specific features like:
- Member savings ratio rules
- Guarantor management
- Payroll deduction files
- Ethiopian calendar support

Our project fills this gap with a **purpose-built solution**.

### 2.4 Technology Trends

Modern financial applications demand:
- **ACID transactions** — PostgreSQL
- **Immutable audit trails** — append-only tables
- **JSON-based APIs** — NestJS REST
- **Modern UIs** — React/Next.js
- **Containerized deployments** — Docker

---

## 3. System Analysis & Design

### 3.1 Requirements

**Functional requirements:**

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Member registration with KYC | Must |
| FR-02 | Multi-role authentication (7 roles) | Must |
| FR-03 | Savings accounts (3 types) | Must |
| FR-04 | Deposits and withdrawals | Must |
| FR-05 | Loan application with eligibility check | Must |
| FR-06 | Multi-stage loan approval | Must |
| FR-07 | Double-entry ledger | Must |
| FR-08 | Interest calculation (declining balance) | Must |
| FR-09 | Repayment schedule generation | Must |
| FR-10 | Payroll deduction file | Must |
| FR-11 | Member self-service portal | Must |
| FR-12 | Reports (trial balance, PAR, income) | Must |
| FR-13 | Audit trail | Must |
| FR-14 | Amharic/English + Ethiopian calendar | Should |
| FR-15 | Excel export | Should |

**Non-functional requirements:**

| ID | Requirement |
|---|---|
| NFR-01 | Money stored as NUMERIC(18,2), never float |
| NFR-02 | Immutable ledger entries (append-only) |
| NFR-03 | JWT auth with 12h expiration |
| NFR-04 | bcrypt passwords (cost 12) |
| NFR-05 | Role-based access with segregation of duties |
| NFR-06 | HTTPS in production |
| NFR-07 | Encrypted database backups |
| NFR-08 | Response time < 500ms for most endpoints |
| NFR-09 | Amharic/English UI |
| NFR-10 | Ethiopian calendar support |

### 3.2 System Architecture

![System Architecture](figures/architecture.png)

The system uses a **three-tier architecture**:

1. **Frontend** — Next.js 16 with React 19, Tailwind CSS v4
2. **Backend** — NestJS 12 with TypeORM 0.3
3. **Database** — PostgreSQL 16 (money + ledger), Redis 7 (cache)

In production, **nginx** sits in front of the frontend and backend, terminating TLS on port 443.

### 3.3 Database Design

![Entity-Relationship Diagram](figures/erd.png)

**13 business tables:**

| Table | Purpose | Key Columns |
|---|---|---|
| `members` | SACCO members with KYC | id, member_no, full_name, status |
| `users` | Login accounts | id, username, password_hash, role |
| `savings_accounts` | One per member per type | id, member_id, account_type, balance |
| `savings_transactions` | Deposit/withdrawal history | id, account_id, txn_type, amount |
| `loans` | Loan records | id, member_id, principal, status |
| `loan_schedules` | Repayment schedule rows | id, loan_id, installment_no, due_date |
| `guarantors` | Loan guarantors | id, loan_id, member_id, amount |
| `payroll_runs` | Monthly exports | id, period, total_amount, status |
| `payroll_run_items` | Per-member payroll | id, run_id, member_id, total_amount |
| `ledger_accounts` | Chart of accounts (7 seeded) | id, code, name, type |
| `ledger_entries` | Append-only double-entry | id, ledger_account_id, debit, credit |
| `audit_log` | Every mutation | id, user_id, action, before/after |
| `migrations` | TypeORM tracker | id, timestamp, name |

### 3.4 Use Case Diagram

![Use Case Diagram](figures/use-cases.png)

**Key use cases by actor:**

| Actor | Use Cases |
|---|---|
| Member | Login, View Dashboard, View Statements, Apply for Loan, View Loan Details |
| Cashier | Register Member, Open Savings Account, Deposit, Withdraw, Apply for Loan, Disburse Loan |
| Credit Committee | Review Pending Loans, Approve/Reject Loans |
| Chairperson | Approve Loans, View Reports |
| Accountant | View Reports, Export Excel, Generate Payroll |
| Auditor | View Statements, View Reports, View Audit Log (read-only) |
| Admin | All of the above + User Management |

### 3.5 Key Sequence Diagram: Loan Application

![Loan Application Flow](figures/loan-flow.png)

1. Member (or cashier on their behalf) submits a loan application
2. System checks eligibility (3× savings ratio, no existing active loan)
3. System creates a `loans` row with status `pending`
4. Credit committee member reviews and approves
5. System generates the repayment schedule
6. Cashier disburses the loan — **ledger posts: Debit Loans Receivable, Credit Cash**
7. Member repays in installments — **ledger posts: Debit Cash, Credit Loans Receivable**

---

## 4. Implementation

### 4.1 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 16 |
| Frontend | React | 19 |
| Frontend | Tailwind CSS | 4 |
| Backend | NestJS | 12 |
| Backend | TypeORM | 0.3 |
| Backend | Node.js | 20 LTS |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| Auth | JWT + bcrypt | Latest |
| Money math | decimal.js | Latest |
| Reporting | exceljs | Latest |
| Deployment | Docker + Compose | Latest |
| Reverse proxy | nginx | 1.27 |

### 4.2 Module Descriptions

**9 backend modules:**

1. `HealthModule` — `/health` endpoint for monitoring
2. `AuthModule` — JWT login, registration, role guards
3. `MembersModule` — Member CRUD with audit log
4. `SavingsModule` — Accounts, deposits, withdrawals
5. `LedgerModule` — Double-entry engine
6. `LoansModule` — Full lifecycle + interest calculation
7. `ReportsModule` — 7 report endpoints + Excel export
8. `PayrollModule` — Monthly deduction file + reconciliation
9. `AuditModule` — Tamper-evident action log

**8 frontend pages:**

1. `/login` — Authentication
2. `/dashboard` — Member overview with role-aware cards
3. `/statements` — Transaction history
4. `/loans/[id]` — Loan details + schedule
5. `/apply` — Loan application form
6. `/admin/members` — Member management (admin/cashier)
7. `/pending` — Approval queue (committee)
8. `/reports` — Reports (accountant/auditor/admin)

### 4.3 Key Algorithm 1: Double-Entry Ledger

Every financial operation posts **balanced** rows to `ledger_entries`:

```typescript
async post(refType, refId, lines, actorUserId) {
  // 1. Validate balance
  const totalDebit = lines.reduce((s, l) => s.plus(l.debit ?? '0'), new Decimal(0));
  const totalCredit = lines.reduce((s, l) => s.plus(l.credit ?? '0'), new Decimal(0));
  if (!totalDebit.equals(totalCredit)) {
    throw new InternalServerErrorException('Ledger does not balance');
  }
  
  // 2. Resolve account codes to IDs
  const accounts = await this.accountsRepo.find({ where: codes });
  const byCode = new Map(accounts.map((a) => [a.code, a]));
  
  // 3. Insert all entries atomically
  return this.dataSource.transaction(async (tx) => {
    const rows = lines.map((l) => tx.getRepository(LedgerEntry).create({
      ledgerAccountId: byCode.get(l.accountCode).id,
      debit: l.debit ?? '0',
      credit: l.credit ?? '0',
      refType,
      refId,
    }));
    return tx.getRepository(LedgerEntry).save(rows);
  });
}