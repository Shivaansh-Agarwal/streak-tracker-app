# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Learn in Public" streak tracker — a webapp where a user logs, tracks, and
publicly shares their daily learning activity (goals + time-boxed log
entries), visualized as a GitHub-style yearly heatmap. See
`01-problem-statement.md` for the original requirements and
`02-backend-hld.md` / `03-frontend-hld.md` for the design (schema, API
contract, auth flow, deployment).

## Repo layout

This is a monorepo containing **multiple alternative implementations** of the
same backend, plus one frontend:

```
backend/
├── springboot/   ← the ACTIVE, real implementation (Java 25, Spring Boot 4, MySQL)
├── fastapi/      ← stub only (README says "TODO"), not implemented
└── nodeexpress/  ← stub only (README says "TODO"), not implemented
frontend/
└── nextjs16/     ← Next.js 16 app, currently just the default scaffold (no
                     real pages/components built yet — routes described in
                     03-frontend-hld.md are not implemented)
```

Unless told otherwise, work happens in `backend/springboot/` — that's the
only backend with real code. Do not add code to `fastapi/` or `nodeexpress/`
unless explicitly asked to start one of those alternate implementations.

Each subproject may have its own `CLAUDE.md`/`AGENTS.md` — check
`frontend/nextjs16/` before editing there; it points to
`node_modules/next/dist/docs/` since this Next.js version has breaking API
changes not reflected in training data.

## Backend (`backend/springboot/`)

Stack: Java 25, Spring Boot 4 (Web, Data JPA/Hibernate, Security), MySQL. Uses
the Maven wrapper (`./mvnw`) — no global Maven install needed, just Java 25+.
Run all commands below from inside `backend/springboot/`.

```bash
./mvnw spring-boot:run          # compile + run on localhost:8080 (needs MySQL running)
./mvnw -q -o compile            # fastest "does it compile" check
./mvnw test                     # run test suite (src/test/java)
./mvnw package                  # compile + test + build jar
./mvnw clean package -DskipTests -B   # clean build, no tests (used by Dockerfile)
```

Or via Docker Compose (app + MySQL together, no local MySQL needed):
```bash
docker compose up --build
```

Prerequisites/env vars, single-test invocation notes, and the Bruno API
collection (`bruno/`, covers every endpoint) are documented in
`backend/springboot/README.md`; deeper "why" notes (SMTP setup, Docker
concepts, secrets in prod) are in `backend/springboot/docs/QnA.md`.

### Architecture — layered by layer, not by feature

```
src/main/java/com/progresstracker/
├── controller/   HTTP routes (@RestController)
├── service/      business logic
├── repository/   Spring Data JPA interfaces (DB access)
├── entity/       @Entity classes (DB tables)
├── dto/          request/response records for the API
├── exception/    ApiException + GlobalExceptionHandler
├── config/       typed @ConfigurationProperties (Jwt/Otp/Mail/LogPolicy/UsernamePolicy)
└── security/     JWT filter, cookie handling, Spring Security config
```

Key domain rules worth knowing before touching auth/logs code (full detail in
`02-backend-hld.md`):

- **Auth is OTP-only, no passwords.** `/auth/login` sends an OTP (creates a
  `users` row in `PENDING_PROFILE` status on first login for an email);
  `/auth/verify-otp` sets access + refresh JWTs as httpOnly/Secure/SameSite=Lax
  cookies — tokens are never returned in JSON bodies.
- **User onboarding is a state machine**: `PENDING_PROFILE` → `ACTIVE`, flipped
  by `PATCH /users/me` once `username` + `full_name` are set. Username
  uniqueness is checked against a config-driven reserved-word blocklist
  (`UsernamePolicyProperties`).
- **A Goal can't be deleted while Logs reference it** — enforced at the DB
  level via `ON DELETE RESTRICT` on `log_entries.goal_id`, not just in the
  service layer.
- **Log entries store a redundant `log_date`** (derived from `start_time`
  converted into the log's captured `timezone`, persisted at write time) so
  month/year/heatmap queries don't need per-row timezone conversion. The
  timezone is captured from the browser at creation and is immutable —
  day-bucketing for a public profile must be stable regardless of the
  viewer's own timezone.
- **Overlap detection** (a user can't have two logs with overlapping
  start/end times) is enforced in the application layer inside a transaction
  — MySQL has no native range-exclusion constraint. Same for the 30-day
  backdate window / no-future-dates rule.
- **`/public/**` routes are the only unauthenticated routes** and are grouped
  under that path prefix specifically so `SecurityConfig` can allow-list them
  as a single block.

### Deployment model

All three pieces (Next.js frontend, Spring Boot backend, MySQL) deploy as
separate services on Railway. The frontend proxies `/api/*` to the backend
via Next.js `rewrites()` so both are same-origin from the browser's
perspective — this is what lets the JWT cookie use `SameSite=Lax` without a
CSRF token. See `02-backend-hld.md` §6 for the full deployment/config story.
