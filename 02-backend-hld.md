# Backend HLD

## 1. Requirements

### 1.1 Functional Requirements

*Auth:*
- Authentication Method: Users can sign up / sign in via Email + OTP (no password).
- Session/State Management After Login: System issues a JWT access token + refresh token on successful OTP verification.
- System supports refreshing an access token via a valid refresh token.

*Profile Setup:*
- After Signup, before proceeding, a user needs to setup a username (same will be used for their public link) - it should be unique, their full name, their profile picture (optional).
- Username uniqueness check must also reject values in a config-driven reserved-word blocklist (e.g. `admin`, `api`, `signin`).

*Goal:*
- Operations Allowed: create | update | delete | read
- A Goal cannot be deleted while it has Logs linked to it — the user must delete/reassign its Logs first. This avoids silently destroying heatmap/streak history when a Goal is removed.
- A Goal is just a text field.

*Log:*
- Operations Allowed: create | update | delete | read
- A user can create a Log entry against a Goal.
- A Log entry contains - description (required), start time, end time.
- The system rejects a Log whose time range overlaps any existing Log for that user.
- System rejects a Log dated more than 30 days in the past or any time in the future.
- Users can fetch their own Logs filtered by year and month.
- System can compute per-day aggregated hours for a given year, for heatmap rendering.

*Sharing / Public Profile:*
- Users can toggle their profile's public/private visibility.
- Anyone (unauthenticated) can fetch a public user's profile data (goals summary, logs, heatmap) via their handle — only if that profile is public.

### 1.2 Non-Functional Requirements

*Security:*
- OTP endpoints must be rate-limited per email/IP to prevent abuse. JWTs delivered via httpOnly, Secure, SameSite=Lax cookies (not returned in JSON response bodies). Passwords are never stored (OTP-only auth).

---

## 2. Core Entities | DB Schema

Naming convention: Java entity classes are singular PascalCase (`User`,
`Goal`, `LogEntry`, `RefreshToken`, `OtpChallenge`); MySQL tables are plural
snake_case (`users`, `goals`, `log_entries`, `refresh_tokens`,
`otp_challenges`) — standard Spring Data JPA / Hibernate convention.

### 2.1 `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT | PK, auto-increment | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | login identity |
| username | VARCHAR(50) | UNIQUE, NULLABLE | public link slug (`/u/<username>`); null until Profile Setup completes; checked against a config-driven reserved-word blocklist |
| full_name | VARCHAR(255) | NULLABLE | set during Profile Setup |
| profile_picture_url | VARCHAR(500) | NULLABLE | optional |
| status | ENUM('PENDING_PROFILE','ACTIVE') | NOT NULL, default `PENDING_PROFILE` | explicit onboarding state; flips to `ACTIVE` once username + full_name are set |
| is_public | BOOLEAN | NOT NULL, default `FALSE` | controls visibility of `/u/<username>` |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### 2.2 `goals`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → `users.id`, NOT NULL | |
| title | VARCHAR(255) | NOT NULL | Goal is a plain text field, no description |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

### 2.3 `log_entries`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → `users.id`, NOT NULL | denormalized alongside goal_id to make user-scoped queries (overlap check, year/month filter, heatmap aggregation) a single-table lookup without a join through goals |
| goal_id | BIGINT | FK → `goals.id`, **ON DELETE RESTRICT**, NOT NULL | enforces "can't delete a Goal with Logs" directly at the DB level |
| description | TEXT | NOT NULL | |
| start_time | TIMESTAMP | NOT NULL | stored in UTC |
| end_time | TIMESTAMP | NOT NULL | stored in UTC |
| timezone | VARCHAR(64) | NOT NULL | IANA zone captured from the browser at creation (e.g. `Asia/Kolkata`); immutable after creation |
| log_date | DATE | NOT NULL | derived from `start_time` converted into `timezone` at write time, and persisted (not computed on read) so per-day/per-month/per-year queries can use a single indexed lookup instead of converting timezones per row |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

Indexes: `(user_id, log_date)` for month/year/heatmap queries;
`(user_id, start_time, end_time)` to support the overlap check.
Overlap validation itself is enforced in the application layer inside a
transaction (MySQL has no native range-exclusion constraint).

### 2.4 `refresh_tokens`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT | PK, auto-increment | |
| user_id | BIGINT | FK → `users.id`, NOT NULL | |
| token_hash | VARCHAR(255) | NOT NULL | raw token is never stored, only a hash |
| expires_at | TIMESTAMP | NOT NULL | |
| revoked_at | TIMESTAMP | NULLABLE | set on logout / rotation |
| created_at | TIMESTAMP | NOT NULL | |

### 2.5 `otp_challenges`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGINT | PK, auto-increment | |
| email | VARCHAR(255) | NOT NULL | not linked by user_id — a signup OTP is issued before a `users` row necessarily exists in `ACTIVE` state |
| otp_hash | VARCHAR(255) | NOT NULL | OTP is hashed, never stored in plaintext |
| expires_at | TIMESTAMP | NOT NULL | |
| attempt_count | INT | NOT NULL, default 0 | incremented per verify attempt; used to lock out after N failures |
| created_at | TIMESTAMP | NOT NULL | |

Indexes: `(email, created_at)` to fetch/rate-limit the latest challenge per email.

---

## 3. APIs

REST style: resource + HTTP verb. Private endpoints are cookie-authenticated
(httpOnly JWT); `/public/**` routes take no auth and are the only routes an
unauthenticated caller can reach — kept under their own path prefix so the
Spring Security config can allow-list them as a single block.

### 3.1 Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Body: `email`. Triggers an OTP send; used for both signup and signin — creates a `users` row in `PENDING_PROFILE` status on first-ever login for that email. |
| POST | `/auth/verify-otp` | Public | Body: `email`, `otp`. On success, sets access + refresh token httpOnly cookies. |
| POST | `/auth/refresh` | Refresh cookie | Rotates the access token (and refresh token) using the refresh cookie. |
| POST | `/auth/logout` | Private | Revokes the current refresh token (`revoked_at`) and clears cookies. |

### 3.2 Profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/users/me` | Private | Fetch own profile (username, full_name, profile_picture_url, status, is_public). |
| PATCH | `/users/me` | Private | Update username/full_name/profile_picture_url/is_public. Used both for the initial Profile Setup step (flips status to `ACTIVE`) and later edits. Username uniqueness + reserved-word check enforced here. |

### 3.3 Goals

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/goals` | Private | List own Goals (for the goal-select dropdown). |
| POST | `/goals` | Private | Create a Goal. |
| PATCH | `/goals/{id}` | Private | Update a Goal's title. |
| DELETE | `/goals/{id}` | Private | Delete a Goal. Returns 409 if it still has Logs (DB `ON DELETE RESTRICT`). |

### 3.4 Logs

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/logs?year=&month=` | Private | Month log list, sorted by `start_time`. |
| GET | `/logs/heatmap?year=` | Private | Per-day aggregated hours for the whole year (365/366 entries) for heatmap rendering. |
| POST | `/logs` | Private | Create a Log. Server validates: goal ownership, 30-day backdate window, no future date, no overlap with existing Logs. |
| PATCH | `/logs/{id}` | Private | Update a Log. Re-validates the same overlap/date-range rules. |
| DELETE | `/logs/{id}` | Private | Delete a Log. |

### 3.5 Public

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/public/{username}` | Public | Profile summary (full_name, profile_picture_url) — 404 if username doesn't exist, 403 if it exists but `is_public = false` (lets the frontend show a distinct "this profile is private" message; a deliberate tradeoff that confirms a private username is registered). |
| GET | `/public/{username}/heatmap?year=` | Public | Same shape as `/logs/heatmap`, scoped to a public profile. |
| GET | `/public/{username}/logs?year=&month=` | Public | Same shape as `/logs`, scoped to a public profile. |

### 3.6 Open Items Not Yet Resolved

- Exact request/response DTOs and validation error format.
- OTP resend cooldown / rate-limit thresholds (ties to the rate-limiting NFR).

---

## 4. High Level Architecture

```
 Browser
   │  (HTML/JSON over HTTPS, JWT in httpOnly cookie)
   ▼
 Next.js app  ──SSR fetch──►  Spring Boot API (single service)
 (dashboard: CSR)                  │   │
 (/u/[handle]: SSR)                │   └──► MySQL (users, goals, log_entries,
                                   │          refresh_tokens, otp_challenges)
                                   └──► Email provider (OTP delivery)
```

- **Next.js app** — renders `/signin` and `/dashboard` client-side; renders
  `/u/[handle]` server-side (SSR) for SEO, fetching public data from the
  Spring Boot API at request time.
- **Spring Boot API** — single service, layered internally as
  Controller → Service → Repository. Spring Security Filter Chain sits in
  front of the controllers as the single authentication gatekeeper (see 4.2).
- **MySQL** — one schema, the five tables from Section 2.
- **Email provider** — external dependency, used only to deliver OTP codes.

---

## 5. Deep Dives

1. Authentication + Authorization Flow (OTP + JWT lifecycle)
2. Overlap Detection
3. Timezone-aware day bucketing
4. Heatmap aggregation query

---

## 6. Deployment

All three pieces — Next.js frontend, Spring Boot backend, MySQL — are hosted
on **Railway**, as separate services within one Railway project.

- **Frontend (Next.js):** deployed as a Node service (not a static export),
  since same-origin cookie proxying (below) requires a running Next.js
  server, not just static HTML.
- **Backend (Spring Boot):** deployed as a **Docker container**. A
  multi-stage Dockerfile builds the JAR (Maven/Gradle build stage) and runs
  it on a slim JRE base image.
- **Database (MySQL):** Railway's managed MySQL plugin, provisioned in the
  same project.

### 6.1 Same-Origin Cookies via Next.js Rewrites

The frontend and backend are still two separate Railway services with two
different underlying URLs — but the browser never needs to know that.
`next.config.js` uses `rewrites()` to proxy `/api/*` requests from the
browser to the Spring Boot service's internal URL, server-side, inside the
Next.js Node process. The browser only ever sees requests to the frontend's
own domain, so:
- The JWT cookie set by the backend (via the proxied response) is scoped to
  the frontend's domain — same-site, so `SameSite=Lax` behaves as originally
  designed, no CSRF token needed.
- No custom domain purchase or subdomain setup is required to satisfy the
  "live public URL" requirement.

### 6.2 Config & Secrets

Per-service environment variables in Railway (not committed to the repo): DB connection string/credentials, JWT signing secret, email provider API key, and the Spring Boot service's internal URL (used by the Next.js rewrite).

### 6.3 CI/CD

Railway's GitHub integration auto-deploys each service on push to `main` — no separate pipeline needed for a solo project at this scale.

### 6.4 Open Items (Not Yet Resolved)

- Schema migration tooling (e.g. Flyway/Liquibase) for versioning the MySQL schema across deploys.
