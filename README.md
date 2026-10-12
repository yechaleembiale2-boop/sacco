# Injibara University Staff Savings and Credit Management System

Digital SACCO / Microfinance Platform: Industrial Project I,
Department of Information Systems, Injibara University.

> **Money rule:** never use `float`/`number` for money. The database uses
> `NUMERIC(18,2)`, and TypeScript code uses strings or `decimal.js`.

## Repository layout

```
sacco/
├── backend/    NestJS API (TypeScript, TypeORM, PostgreSQL, Redis)
├── frontend/   Next.js (App Router) + Tailwind CSS
├── infra/      docker-compose.yml for PostgreSQL 16 + Redis 7
└── docs/       Documentation (put AI-PROMPT.md here)
```

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.9+ (22 LTS recommended) | https://nodejs.org |
| npm | comes with Node | we use npm only (no yarn/pnpm) |
| Git | any recent | Windows: Git for Windows (includes Git Bash) |
| Docker | Docker Desktop or Engine + Compose plugin | Windows: enable WSL2 backend |

Windows users: use Git Bash or PowerShell.

## First-time setup

```bash
# 1. Clone
git clone <REPO_URL> sacco
cd sacco

# 2. Start PostgreSQL + Redis
cd infra
cp .env.example .env
docker compose up -d
docker compose ps             # both services should be "healthy"
cd ..

# 3. Backend
cd backend
cp .env.example .env          # passwords must match infra/.env
npm install
npm run start:dev             # http://localhost:3001/api/v1/health
```

Open a **second terminal**:

```bash
# 4. Frontend
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

## Ports

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (NestJS) | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

If port 5432 is already used by a local PostgreSQL install, set
`POSTGRES_PORT=5433` in `infra/.env` and `DB_PORT=5433` in `backend/.env`.

## Useful commands

```bash
docker compose -f infra/docker-compose.yml ps        # status
docker compose -f infra/docker-compose.yml logs -f   # logs
docker compose -f infra/docker-compose.yml down      # stop (keeps data)
docker compose -f infra/docker-compose.yml down -v   # stop AND wipe data
cd backend && npm test                               # run Jest tests
```

## Team workflow

- Branches: `main` (protected), `develop`, `feat/<short-name>`
- Never commit directly to `main`. Open a pull request into `develop`.
- Commits use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- Never commit `.env` files or real member data.
- Every financial calculation needs a Jest test.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `port is already allocated` | Another service uses the port; change it in `infra/.env` and `backend/.env` |
| Backend: `password authentication failed` | `backend/.env` passwords don't match `infra/.env`. If you changed them after first start, run `docker compose down -v` and start again |
| `docker: command not found` (Windows) | Start Docker Desktop and wait for it to say "running" |
| Line-ending warnings on Windows | Ignore; `.gitattributes` handles it |
