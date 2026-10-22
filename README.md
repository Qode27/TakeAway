# Order Hub

Order Hub is a modular monolith for takeaway teams that need one operational screen for Uber Eats, Deliveroo, and Just Eat orders. It is designed for a real kitchen environment first: dark high-contrast UI, fast status movement, realtime updates, duplicate-safe ingestion, and clear adapter boundaries for platform onboarding.

## CI/CD on Azure (classroom demo)


Step-by-step guide: **[docs/azure-cicd-guide.md](docs/azure-cicd-guide.md)**. It covers the Azure Pipeline ([azure-pipelines.yml](azure-pipelines.yml)), building the [Dockerfile](Dockerfile) image, pushing to Azure Container Registry, and deploying to Kubernetes (AKS).

## Monorepo layout

```text
.
|-- apps
|   |-- backend
|   `-- frontend
|-- docs
|   |-- architecture.md
|   `-- screenshots.md
|-- infra
|   `-- docker-compose.yml
|-- Dockerfile             (one image: backend + built frontend)
|-- azure-pipelines.yml    (CI/CD pipeline)
|-- k8s                    (Kubernetes manifests)
`-- packages
    |-- config
    `-- shared
```

## Integration readiness

### Real-ready now

- Uber Eats inbound webhook adapter and normalization path
- Unified order persistence, raw payload archiving, idempotency protection, realtime fan-out
- Staff login with roles, JWT access and refresh tokens, and audit logging hooks
- Kitchen dashboard, order list, detail page, analytics page, and settings page
- Email fallback ingestion module structure with parser isolation

### Adapter-ready now

- Uber Eats outbound status sync is isolated behind [apps/backend/src/services/platform-sync.service.ts](apps/backend/src/services/platform-sync.service.ts) and currently uses a mock transport until production credentials are available
- Deliveroo direct API integration
- Just Eat direct API integration

### Requires live credentials later

- Production Uber Eats webhook secret and outbound status credentials
- Deliveroo partner API credentials if direct access is granted
- Just Eat partner API credentials if direct access is granted
- IMAP mailbox credentials for live email fallback polling

## Exact local run steps

### 1. Prerequisites

- Node.js 22+
- npm 10+
- Docker Desktop with Docker Compose

### 2. Environment files

Copy these files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
```

### 3. Start infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

### 4. Install dependencies

```bash
npm install
```

### 5. Generate Prisma client

```bash
npm run db:generate
```

### 6. Apply migrations

```bash
npm run db:migrate
```

### 7. Seed sample data

```bash
npm run db:seed
```

### 8. Run backend and frontend

```bash
npm run dev
```

### 9. Open the app

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/api/health`
- Backend readiness: `http://localhost:4000/api/ready`

### Seed users

- `admin@orderhub.ie` / `Password123!`
- `manager@orderhub.ie` / `Password123!`
- `kitchen@orderhub.ie` / `Password123!`

## Full local stack with app containers

Build the app image and start it with PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Open `http://localhost:4000`. The container runs migrations and loads the seed data on start.

## Exact production deploy steps

### Option A: Docker-hosted VPS

1. Provision a Linux VPS with Docker and Docker Compose.
2. Clone the repo.
3. Copy production environment values into `apps/backend/.env` and `apps/frontend/.env`.
4. Set strong secrets:
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `UBER_EATS_WEBHOOK_SECRET`
5. Start database and Redis, or point to managed services.
6. Apply migrations:

```bash
npm install
npm run db:generate
npm run db:migrate
```

7. Build and start the stack:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

8. Put a reverse proxy in front of the frontend and backend.
9. Route HTTPS traffic to the app container on port `4000` (it serves both the API and the frontend)
10. Verify:
   - `/api/health`
   - `/api/ready`
   - login flow
   - webhook ingress

### Option B: Azure Kubernetes Service (CI/CD)

Follow [docs/azure-cicd-guide.md](docs/azure-cicd-guide.md).

## Security and reliability basics already included

- Helmet
- CORS allow-list support via `APP_ORIGIN`
- Auth and webhook rate limiting
- JWT access and refresh token flow
- Password hashing with bcrypt
- Redacted structured logging with Pino
- Duplicate-safe ingestion with idempotency keys and unique constraints
- Raw payload archive for troubleshooting
- Graceful shutdown hooks
- Error boundaries and API error responses

## Environment notes

Key backend environment values:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `APP_ORIGIN`: comma-separated frontend origins
- `ENABLE_BACKGROUND_WORKERS`: enable BullMQ workers
- `ENABLE_EMAIL_POLLING`: enable IMAP polling
- `EMAIL_FALLBACK_ENABLED`: keep email fallback ingestion available
- `TRUST_PROXY`: reverse proxy support

## Verification status

Verified in this workspace:

- `npm run lint`
- `npm run build`
- `npm run test`
- built backend starts and serves `/api/health`

Could not be live-verified in this workspace because the host machine does not have Docker, Postgres CLI, or Redis installed:

- `docker compose up`
- live PostgreSQL migration execution
- live seed execution against PostgreSQL

The repo now includes a committed initial Prisma migration in [apps/backend/prisma/migrations/20260402094000_init/migration.sql](apps/backend/prisma/migrations/20260402094000_init/migration.sql) so deployment does not depend on generating migrations locally.

## Fixtures

- Uber Eats webhook sample: [apps/backend/fixtures/uber-order.json](apps/backend/fixtures/uber-order.json)
- Deliveroo sample payload: [apps/backend/fixtures/deliveroo-order.json](apps/backend/fixtures/deliveroo-order.json)
- Just Eat sample payload: [apps/backend/fixtures/just-eat-order.json](apps/backend/fixtures/just-eat-order.json)
- Deliveroo email fallback: [apps/backend/fixtures/deliveroo-email.eml](apps/backend/fixtures/deliveroo-email.eml)
- Just Eat email fallback: [apps/backend/fixtures/just-eat-email.eml](apps/backend/fixtures/just-eat-email.eml)
