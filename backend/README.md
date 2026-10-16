# Injibara University SACCO — Digital Microfinance Platform

A complete savings and credit management system for Injibara University staff.

> **Industrial Project I** — Department of Information Systems, Injibara University

## Team

| Name | ID |
|---|---|
| Amare Agerneh | 1500596 |
| Gebrehana Desalegn | 1500826 |
| Basleal Getaneh | 1500635 |
| Yechale Embiale | 1501171 |
| Simachew Alene | 1501075 |
| Addisu Fenta | 1500551 |

## Features

- **Members** — registration, KYC, soft delete
- **Savings** — mandatory/voluntary/share accounts, deposits, withdrawals
- **Loans** — apply, approve, disburse, repay with amortization schedule
- **Double-entry ledger** — immutable, balanced, audited
- **Reports** — trial balance, income statement, portfolio at risk, defaulters, dividend
- **Payroll** — monthly deduction file for the finance office
- **Auth** — JWT with 7 roles, segregation of duties enforced
- **Portal** — Next.js member UI with Amharic/English and Ethiopian calendar

## Quick Start

**Prerequisites:** Docker Desktop, Node.js 20+, Git Bash (Windows) or bash (macOS/Linux)

```bash
# Clone
git clone https://github.com/yechaleembiale2-boop/sacco.git
cd sacco

# Start databases
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d

# Backend
cd backend
npm install
npm run migration:run
npm run start:dev      # runs on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev            # runs on http://localhost:3000