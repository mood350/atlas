# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgencyCRM** — SaaS multi-tenant platform for African web agencies. Centralizes the full client lifecycle: CRM pipeline, quotes, contracts, invoicing with Mobile Money (FedaPay/PayDunya), project management, and appointments.

The repo has two sub-projects:
- `backend/` — Spring Boot 3.x (Java 21) REST API, port 8081
- `frontend/` — Next.js 16 + Tailwind CSS 4, port 3000

---

## Backend (Spring Boot)

### Commands

```bash
# Run (from backend/)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Build
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=QuoteServiceTest
```

Requires: Java 21, PostgreSQL 15 (`atlas_db`), Redis 7.

### Architecture

All business entities live in `src/main/java/com/atlas/backend/` and are organized by domain package. Each package typically contains: Entity, Repository, Service, Controller, Dto, Mapper.

**Multi-tenancy rule:** Every entity carries `agency_id`. Every service method must call `findByIdAndAgencyId()` before operating — never `findById()` alone.

**Auth flow:** Stateless JWT. `JwtAuthFilter` → `JwtService` validates access tokens (15 min). Refresh tokens last 7 days. OTP codes (6 digits, 15 min TTL) are used for account activation, password reset, and email change.

**Key cross-cutting concerns:**
- `Listeners.java` (`utils/`) — JPA auditing, sets `createdAt` / `lastModifiedDate` automatically
- `GlobalExceptionHandler` (`common/exception/`) — all error responses go through here
- `SecurityConfig` (`config/`) — CORS origins from `cors.allowed-origins` property; public routes: `/api/auth/**`, `/api/portal/**`, `/api/webhooks/**`
- `DealInactivityScheduler` — Redis-deduped hourly job; escalates after `crm.max-reminders` without response
- `QuotePdfService` — iText 7 PDF generation; OHADA-compliant numbering (`DEV-YYYY-NNNNN`)

**Implemented modules (Phases 0–4):** `agency`, `auth`, `user`, `role`, `token`, `client`, `crm/deal`, `crm/pipeline`, `quote`, `contract`, `invoice`, `payment`, `project`

**Pending modules:** `appointment` (Phase 5a), `analytics` (Phase 5b), `communication` (Phase 6)

### Configuration

`src/main/resources/application.properties` — used for local dev with hardcoded defaults.  
For production, override via environment variables (see `application-example.properties`).

Sensitive keys expected as env vars: `FEDAPAY_API_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PUBLIC_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`.

Database: `jdbc:postgresql://localhost:5432/atlas_db`, user `postgres`.  
`spring.jpa.hibernate.ddl-auto=update` — schema is auto-managed in dev.

Insert default roles once on first run:
```sql
INSERT INTO role (role_name, description) VALUES
  ('SUPER_ADMIN','Administrateur plateforme'),('OWNER','Propriétaire agence'),
  ('ADMIN','Administrateur agence'),('MEMBER','Membre agence'),('CLIENT','Accès portail client')
ON CONFLICT DO NOTHING;
```

Swagger UI: `http://localhost:8081/swagger-ui.html`

---

## Frontend (Next.js)

### Commands

```bash
# Run dev server (from frontend/)
npm run dev       # http://localhost:3000

# Build
npm run build

# Lint
npm run lint
```

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.

> **Warning:** This is Next.js 16 — it has breaking changes from earlier versions. Before writing any Next.js-specific code, read the relevant guide in `frontend/node_modules/next/dist/docs/`.

### Structure

Uses the App Router (`frontend/app/`). Pages are `page.tsx` files inside route folders. Global styles in `app/globals.css`. Layout in `app/layout.tsx`.

The frontend communicates with the backend at `http://localhost:8081`. CORS is configured on the backend for `http://localhost:3000`.
