# ---------------------------------------------------------------
# Order Hub - one container image for the whole application.
# The backend (Node/Express) also serves the built React frontend.
# ---------------------------------------------------------------

# ---------- Stage 1: build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Prisma needs OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy only package files first so "npm ci" is cached between builds
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/config/package.json packages/config/package.json
COPY apps/backend/prisma apps/backend/prisma
RUN npm ci

# Copy the source code and build everything
COPY . .
RUN npm run build

# ---------- Stage 2: run ----------
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 4000

# Background workers need Redis - off by default
ENV ENABLE_BACKGROUND_WORKERS=false

# On start: if a database is configured, create tables + load demo data. Then start the server.
WORKDIR /app/apps/backend
CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npx prisma migrate deploy && npx tsx prisma/seed.ts; fi; node dist/server.js"]
