# Database Schema (Draft)

See `backend/src/database/` for TypeORM entities (added Day 2+).

## Tables (planned)

| Table | Purpose |
|---|---|
| `members` | SACCO members with KYC |
| `users` | Login accounts + roles |
| `savings_accounts` | One per member per type |
| `savings_transactions` | Deposit/withdrawal history |
| `loans` | Loan records with status |
| `loan_schedules` | Repayment schedule rows |
| `loan_repayments` | Actual repayments |
| `guarantors` | Loan guarantor links |
| `ledger_accounts` | Chart of accounts |
| `ledger_entries` | Append-only double-entry rows |
| `audit_log` | Every state change |
| `settings` | Configurable rates, limits |

## Rules
- Money: `NUMERIC(18,2)` — **never** float
- `ledger_entries` is **append-only**
- Every business table change writes to `audit_log`
- All money movements wrapped in a DB transaction