# Architecture Notes

## Overview

Order Hub is a modular monolith split into a React frontend, an Express backend, and shared TypeScript contracts. The backend owns ingestion, normalization, persistence, authentication, audit logging, realtime fan-out, and operational settings.

This remains a single deployable application boundary for operational simplicity. Platform integrations are modularized behind adapters, but the system is intentionally not split into microservices.

## Ingestion model

- Uber Eats is the first-class direct webhook integration.
- Deliveroo and Just Eat use the same adapter contract as Uber Eats.
- Email fallback is isolated in its own parsing layer so it can be removed once direct APIs are available.
- Every adapter returns the same normalized order shape from `@order-hub/shared`.

## Integration readiness

- Real-ready: Uber Eats inbound webhook ingestion, normalized persistence, realtime board updates, staff auth, dashboard operations.
- Adapter-ready: Uber Eats outbound status sync transport, Deliveroo direct API integration, Just Eat direct API integration.

## Reliability choices

- Raw ingestion payloads are archived for troubleshooting.
- Idempotency keys prevent duplicate order creation.
- BullMQ provides retryable background handling.
- Webhook signature verification is wired for Uber Eats.
- Health and readiness endpoints support App Service, Docker, and reverse proxy deployment.

## Deployment

- PostgreSQL and Redis run as external services or Docker containers.
- Backend and frontend have separate production Dockerfiles.
- Environment-driven configuration supports Azure App Service or a Docker-hosted VPS.

## Boundaries

- `services/adapters/*` handles platform-specific parsing and normalization.
- `services/orders/*` handles persistence, state transitions, and dashboard querying.
- `services/platform-sync.service.ts` isolates outbound platform updates from the order lifecycle.
- `packages/shared` is the single source of truth for DTOs, enums, and normalized order validation.
