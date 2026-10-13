# REST API Contract

Base URL: `/api/v1`

## Planned Endpoints (by module)

### Auth

- `POST /auth/login`
- `POST /auth/mfa/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

### Members

- `GET  /members`
- `POST /members`
- `GET  /members/:id`

### Savings

- `GET  /savings/accounts`
- `POST /savings/accounts/:id/deposits`
- `POST /savings/accounts/:id/withdrawals`

### Loans

- `POST /loans`              (apply)
- `POST /loans/:id/approve`  (committee)
- `POST /loans/:id/disburse` (cashier)
- `GET  /loans/:id/schedule`

### Reports

- `GET  /reports/portfolio-at-risk`
- `GET  /reports/defaulters`
- `GET  /reports/income-expense`

Full spec added incrementally.
