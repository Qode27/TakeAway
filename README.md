# Order Hub

Unified dashboard for takeaway restaurants to manage orders from Uber Eats, Deliveroo, and Just Eat in one screen. Designed for kitchen environments with dark UI, real-time updates, and fast status management.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Query, Socket.io
- **Backend**: Express, Prisma, BullMQ, Redis
- **Database**: PostgreSQL
- **Monorepo**: npm workspaces

## Quick Start (Docker)

```bash
# 1. Copy env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 2. Start everything
docker compose -f infra/docker-compose.yml --profile app up -d --build
```

Access at `http://localhost:5173` (frontend) and `http://localhost:4000` (backend).

**Test users**: `admin@orderhub.ie` / `Password123!`

## Quick Start (Local Dev)

```bash
# Prerequisites: Node.js 22+, Docker

# 1. Copy env files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 2. Start infrastructure
docker compose -f infra/docker-compose.yml up -d postgres redis

# 3. Install and setup
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Run both apps
npm run dev
```

## Project Structure

```
apps/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── adapters/ # Platform integrations
│   └── prisma/       # Database schema
└── frontend/         # React SPA
    └── src/
        ├── pages/   # Route pages
        ├── components/
        └── hooks/
packages/
├── shared/           # Types, DTOs, enums
└── config/           # Shared configuration
infra/
└── docker-compose.yml
```

## Key Features

- Real-time order updates via Socket.io
- Platform adapters for Uber Eats, Deliveroo, Just Eat
- Email fallback parsing
- JWT authentication with roles (admin, manager, kitchen)
- Idempotency protection against duplicate orders
- Background job processing with BullMQ

## Environment Variables

**Backend** (`apps/backend/.env`):

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `APP_ORIGIN` - Allowed frontend origins (comma-separated)
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret

**Frontend** (`apps/frontend/.env`):

- `VITE_API_URL` - Backend URL
- `VITE_SOCKET_URL` - Socket.io URL

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/orders` - List orders
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/webhooks/uber-eats` - Uber Eats webhook

## Deployment (Docker)

```bash
# Build and start
docker compose -f infra/docker-compose.yml --profile app up -d --build

# View logs
docker compose -f infra/docker-compose.yml logs -f
```

Services: PostgreSQL (5432), Redis (6379), Backend (4000), Frontend (5173)

## Scripts

| Command               | Description            |
| --------------------- | ---------------------- |
| `npm run dev`         | Run frontend + backend |
| `npm run build`       | Build all packages     |
| `npm run test`        | Run tests              |
| `npm run lint`        | Lint code              |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate`  | Apply migrations       |
| `npm run db:seed`     | Seed database          |
