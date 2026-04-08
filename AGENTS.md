# Order Hub - Agent Guide

## Quick Start

```bash
# 1. Copy env files (required before anything else)
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 2. Start infra (Postgres + Redis)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 3. Install, generate, migrate, seed
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Run both apps
npm run dev
```

**URLs**: Frontend `http://localhost:5173`, Backend `http://localhost:4000`

## Commands

- `npm run dev` - runs backend + frontend concurrently
- `npm run build` - builds all packages in order
- `npm run test` - runs all package tests
- `npm run lint` - lint all packages
- `npm run db:generate` - Prisma client generation (runs postinstall)
- `npm run db:migrate` - apply Prisma migrations
- `npm run db:seed` - seed database

## Package Structure

- `apps/frontend` - React 19 + Vite, Tailwind, React Query
- `apps/backend` - Express + Prisma + BullMQ
- `packages/shared` - shared types
- `packages/config` - shared config

## Test Users

- `admin@orderhub.ie` / `Password123!`
- `manager@orderhub.ie` / `Password123!`
- `kitchen@orderhub.ie` / `Password123!`

## Key Env Vars (backend)

- `DATABASE_URL` - Postgres
- `REDIS_URL` - Redis (for BullMQ jobs)
- `APP_ORIGIN` - comma-separated frontend origins for CORS
- `ENABLE_BACKGROUND_WORKERS` - enable BullMQ
- `ENABLE_EMAIL_POLLING` - enable IMAP email fallback

## Gotchas

- Must run `db:generate` before `db:migrate`
- Docker must be running for Postgres/Redis
- Frontend env must exist for build to work
- Backend runs on port 4000, not 3000
