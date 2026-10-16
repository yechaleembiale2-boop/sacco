name: hotel_booking_app
description: A hotel booking application with admin and customer features
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  provider: ^6.0.5
  
  # Network & API
  http: ^1.1.0
  dio: ^5.4.0
  logger: ^2.0.2
  
  # Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # UI & Images
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  intl: ^0.18.1
  flutter_rating_bar: ^4.0.1
  flutter_svg: ^2.0.9
  
  # Navigation
  go_router: ^12.1.3
  
  # File Picker (replaces image_picker to avoid web issues)
  file_picker: ^8.0.0
  
  # Utilities
  url_launcher: ^6.2.1
  device_info_plus: ^9.1.1
  connectivity_plus: ^5.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/# Demo Script — Injibara University SACCO

**Duration:** 15 minutes
**Audience:** Advisor + cooperative committee
**Presenters:** [Your name] + 1 teammate

---

## Pre-Demo Checklist (10 minutes before)

- [ ] Docker Desktop running (green "Engine running" indicator)
- [ ] Postgres + Redis containers healthy: `docker ps`
- [ ] Backend running: `cd ~/sacco/backend && npm run start:dev`
- [ ] Frontend running: `cd ~/sacco/frontend && npm run dev`
- [ ] Browser tabs open:
  - Tab 1: `http://localhost:3001/api/v1/health`
  - Tab 2: `http://localhost:3000/login`
  - Tab 3: VS Code with the project open
- [ ] Test data exists: `docker exec sacco-postgres psql -U sacco -d sacco_db -c "SELECT count(*) FROM members;"` (should be > 0)

---

## Demo Flow

### 1. Opening — The Problem (1 min)

> "Today, the SACCO runs on paper ledgers and spreadsheets. Loan eligibility is checked by hand, interest is calculated manually, and members must visit the office to check balances. This causes calculation errors, long delays, and disputes."

### 2. The Solution — Live System (2 min)

- Show the **login page** at `http://localhost:3000/login`
- Point out: **Amharic/English toggle** in the nav — click it to show Amharic
- Click the toggle back to English

### 3. Login as Cashier (2 min)

- Username: `cashier1`
- Password: `CashierPass123!`
- **Point out:**
  - Nav shows: **Dashboard, Statements, Apply for Loan, Members** (no Approvals, no Reports)
  - Quick Action buttons at the top

- Click **Manage Members**
- Point out: the **member list**
- Click **+ New Member**
- Fill in: `IU-2026-0100`, `Test Demo Member`, `+251900000000`
- Click **Create Member**
- **Point out:** the new member appears in the list

### 4. Open a Savings Account + Deposit (2 min)

- Go back to **Dashboard** → **Statements**
- Click the **Mandatory** account button
- **Point out:**
  - Transaction history with running balance
  - **Ethiopian calendar** dates next to Gregorian
  - Deposits in green, withdrawals in red

- Go back → **Dashboard**
- Note the **Total Savings** card

### 5. The Ledger — Double-Entry Proof (2 min)

- Switch to a terminal window
- Run:
  ```bash
  docker exec sacco-postgres psql -U sacco -d sacco_db -c "SELECT SUM(debit) AS dr, SUM(credit) AS cr FROM ledger_entries;"# Evidence Pack — Digital SACCO Platform

**Student:** [Your name]
**ID:** 1501171
**Project:** Injibara University Staff Savings and Credit Management System
**Repository:** https://github.com/yechaleembiale2-boop/sacco

---

## 1. What Was Built

A complete digital SACCO platform with backend API, member portal, and reporting.
Built over 14 days using Agile methodology with sprint-level commits.

## 2. Feature Checklist (from Proposal)

| Requirement | Status | Where |
|---|---|---|
| Member registration + KYC | ✅ | `backend/src/members/` |
| Multi-role authentication | ✅ | `backend/src/auth/` |
| MFA infrastructure | ⏳ | Schema ready (`users.mfa_enabled`) |
| Savings accounts (3 types) | ✅ | `backend/src/savings/` |
| Loan lifecycle | ✅ | `backend/src/loans/` |
| Configurable interest/rule engine | ✅ | `loans.service.ts` constants + `interest.service.ts` |
| Double-entry ledger | ✅ | `backend/src/ledger/` |
| Payroll deduction file | ✅ | `backend/src/payroll/` |
| Member portal | ✅ | `frontend/src/app/` |
| Reports (PAR, defaulters, income, dividend) | ✅ | `backend/src/reports/` |
| Audit trail | ✅ | `backend/src/audit/` |
| Amharic + Ethiopian calendar | ✅ | `frontend/src/lib/i18n.ts`, `ethiopian-calendar.ts` |
| Role-based access + segregation | ✅ | `frontend/src/lib/permissions.ts` + backend guards |

## 3. Evidence — Screenshots

Located in `docs/screenshots/`:

| File | Shows |
|---|---|
| `01-tables.png` | 15 tables in Postgres |
| `02-ledger-entries.png` | Balanced double-entry rows |
| `03-ledger-balance.png` | SUM(debit) = SUM(credit) |
| `frontend-login.png` | Login page |
| `frontend-dashboard.png` | Member dashboard with cards |
| `frontend-statements.png` | Transaction history |
| `frontend-loan-details.png` | Loan schedule + progress |
| `frontend-apply.png` | Loan application form |
| `lang-en.png` | Dashboard in English |
| `lang-am.png` | Dashboard in Amharic |
| `role-admin.png` | Admin sees all |
| `role-cashier.png` | Cashier sees members only |
| `role-committee.png` | Committee sees approvals |
| `role-auditor.png` | Auditor read-only badge |
| `tests-unit.png` | 13 unit tests passing |
| `tests-e2e.png` | 3 e2e tests passing |

## 4. Evidence — Terminal Outputs

Located in `docs/evidence/`:

| File | Shows |
|---|---|
| `01-tables.txt` | `\dt` output — 15 tables |
| `02-ledger-entries.txt` | All ledger entries |
| `03-ledger-balance.txt` | Debit/credit totals |
| `04-loan-record.json` | Full loan JSON |
| `05-loan-schedule.json` | 6-installment schedule |
| `06-payroll-run.json` | Payroll run header |
| `07-payroll-details.json` | Payroll items per member |
| `08-payroll-export.csv` | The actual payroll CSV |

## 5. Commit History (Excerpt)
