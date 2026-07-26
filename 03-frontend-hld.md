# Frontend HLD — Implementation Design

Requirements and product decisions are already settled in `01-problem-statement.md`
and `02-backend-hld.md` (schema, API contract, auth model, deployment
topology) — this doc doesn't repeat them. It only covers *how the frontend
is built*: tech stack, routing, auth wiring, state management, and
deployment specifics.

---

## 1. Tech Stack & Rendering Strategy

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router (`app/` dir, already scaffolded) |
| Language | TypeScript |
| UI | React 19 + Tailwind v4, **no component library** — primitives (dropdown, modal, date/time picker) are hand-rolled. Accepted tradeoff: we own accessibility/keyboard-nav/focus-trap behavior ourselves for every interactive element instead of getting it from something like Radix. |
| Data fetching | **No library** (no SWR/React Query) — plain `fetch` wrapped in per-resource custom hooks (`useGoals`, `useLogs`, `useHeatmap`; see §4). Accepted tradeoff: cache invalidation after mutations is manual, not automatic. |
| Forms/validation | **No library** (no react-hook-form/zod) — hand-rolled `useState` + validation functions that mirror the backend's rules (required fields, overlap check, backdate/future-date window). |
| Package manager | npm (`package-lock.json` present) |

### Rendering per route

| Route | Mode | Why |
|---|---|---|
| `/` | Static (SSG) | Marketing/landing page, no per-request data — pure static content. |
| `/login` | CSR | Email + OTP form; no SEO need, purely interactive. |
| `/dashboard` | CSR shell, **one SSR data call in the layout** | The page itself is client-rendered (all the goal/log/heatmap fetching happens in the browser per §4), but the *layout* wrapping it does a server-side auth check + profile fetch before anything renders — see §3. |
| `/u/[handle]` | SSR | Public, shareable, must be identical for every visitor and benefits from SEO — same reasoning as the original doc. |

**Open question I'm flagging, not deciding for you:** the landing page (`/`) has no content spec yet — this doc treats it as an empty implementation slot (route exists, renders *something*) until you have copy/design for it. Don't block dashboard/auth work on it.

---

## 2. Private & Public Routes

| Route | Access | Notes |
|---|---|---|
| `/` | Public | Static landing page. |
| `/login` | Public | Single email+OTP entry point for both signup and signin (per backend HLD — `/auth/login` handles both). |
| `/dashboard` | Private | Gated by proxy (Next.js 16's renamed middleware convention) + server-side check (§3). Also owns the Profile Setup step: if the authenticated user's status is `PENDING_PROFILE`, `/dashboard` renders the profile-setup form **in place of** the normal dashboard content — there is no separate `/onboarding` route. Once `PATCH /users/me` succeeds (status flips to `ACTIVE`), the same route renders the real dashboard. |
| `/u/[handle]` | Public | Read-only. Two failure states to design for explicitly: handle doesn't exist → 404; handle exists but `is_public = false` → a distinct "this profile is private" state (not a generic 404, per backend HLD §3.5's own/other distinction) unless you want to intentionally hide the difference for privacy reasons — worth deciding when you build this page. |

No route is named `/signin` — kept `/login` per your call. The backend's
username reserved-word blocklist (`02-backend-hld.md` §1.2/2.1) should
include every real top-level route (`login`, `dashboard`, `u`, plus whatever
`/` needs) so a user can't register a username that collides with a route —
that list was only ever "e.g." in the backend doc, so this isn't a conflict,
just something to keep in sync as routes are added.

---

## 3. Auth & Session Handling

Recap from backend HLD: access + refresh JWTs are httpOnly/Secure/SameSite=Lax
cookies, delivered same-origin via the Next.js rewrite proxy (`02-backend-hld.md`
§6.1) — the frontend never reads or stores a token value directly.

### Gating `/dashboard`

Two layers, because the cookie's *presence* and its *validity* are different
questions and only the backend can answer the second one:

1. **Proxy (edge, cheap — Next.js 16 renamed the middleware.ts convention to proxy.ts)** — checks that the access-token cookie exists
   on requests matching `/dashboard/*`. If absent, redirect to `/login`
   immediately. This is just a fast reject for the obvious case (never
   logged in / already logged out); it cannot verify the JWT's signature
   without either calling the backend or duplicating the JWT secret into the
   frontend — and duplicating the secret defeats the point of the backend
   owning auth.

2. **`/dashboard` layout (server component, real check)** — on every render,
   calls the backend's `GET /users/me` **directly against the backend's
   internal URL** (not through the browser-facing `/api/*` rewrite — a
   server component's fetch happens inside the Next.js server process
   itself, so it must forward the incoming request's `Cookie` header
   manually and hit the backend directly, the same internal URL used by
   `next.config.ts`'s `rewrites()`). On `401`, redirect to `/login`. On
   success, this call also gives you the profile once per render — no
   second client-side fetch needed for "who's logged in" data (see §4).

### Profile-setup gate

Same `/users/me` response from the layout carries `status`. If
`PENDING_PROFILE`, the layout renders the profile-setup form instead of
`children`; if `ACTIVE`, it renders the dashboard normally. This lives in the
layout, not as separate proxy logic, since it needs the same fetched
profile object either way.

### Silent token refresh

The access token expires in ~15 minutes. Since there's no data-fetching
library to handle this automatically, client-side authenticated fetches need
a small shared wrapper (one utility, used by every hook in §4) that:

1. Makes the request.
2. On `401`, calls `POST /auth/refresh` once.
3. If refresh succeeds, retries the original request once.
4. If refresh also fails, redirect to `/login`.

This wrapper is the one piece of "infrastructure" code this plain-fetch
approach needs — write it once, reuse it everywhere in §4.

### Logout

`POST /auth/logout` (revokes refresh token + clears cookies server-side) →
frontend redirects to `/login` and clears the in-memory profile context
(§4) so stale UI (e.g. a name in the nav) doesn't flash before the redirect
completes.

No CSRF token — `SameSite=Lax` covers this app's request shape, per backend
HLD.

---

## 4. State Management

Three distinct kinds of state, handled differently:

### Server state (goals, logs, heatmap, profile)

No caching library. Each resource gets a small custom hook
(`useGoals()`, `useLogs(year, month)`, `useHeatmap(year)`) that owns its own
`data`/`loading`/`error` state via `useState` + `useEffect`, and uses the
shared auth-refresh fetch wrapper from §3. This keeps the "no library"
decision but avoids copy-pasting fetch/loading/error boilerplate at every
call site.

**Mutation invalidation is manual** — this is the real cost of skipping
SWR/React Query, flagged here explicitly rather than discovered later: after
`POST/PATCH/DELETE` on a Log or Goal, the component that performed the
mutation must itself trigger a re-fetch of every affected hook (e.g.
deleting a Log needs to re-run `useLogs` *and* `useHeatmap`, since both
derive from the same underlying data). The simplest version of this is each
hook exposing a `refetch()` function, and mutating components calling the
`refetch()`s of whatever else they know is now stale. There's no automatic
dependency graph — you have to know, at each mutation site, what else needs
refreshing.

### Shared UI selection state (selected year / month)

Lifted into the `/dashboard` page component (client component) as plain
`useState`, passed down as props to the heatmap and log-list children.
**Known, accepted limitation:** this is not URL-addressable — refreshing the
page or sharing a link always lands back on the current year/month, it
can't deep-link to "July 2025." If that turns out to matter later, the fix
is moving this into `useSearchParams`/URL state, but that's not where you
landed for now, so it's just documented as a tradeoff rather than solved.

### Client-visible auth/profile state

Populated **once**, server-side, in the `/dashboard` layout (§3's
`/users/me` call), passed to client components via a React Context
provider — no separate client-side fetch, no Zustand/global store. One
consequence to watch: this is a snapshot taken at layout render time, not
live. If the user edits their profile (`PATCH /users/me`, e.g. changing
`full_name` or toggling `is_public`) during the same session, the component
that performs that mutation must update the context value locally from the
`PATCH` response — the context won't refresh itself just because the data
changed server-side.

### Local/UI-only state

Form field values, modal/dropdown open-state, etc. — plain `useState` inside
whatever component owns them, not shared, not lifted anywhere.

---

## 5. Deployment

Carrying forward the topology already decided in `02-backend-hld.md` §6:

- Deployed on **Railway** as a **Node service** (`next start`, not a static
  export) — required because the SSR routes (`/u/[handle]`, the `/dashboard`
  layout's server-side auth check) and the `rewrites()` proxy both need a
  running Node server, not static HTML.
- `next.config.ts` `rewrites()` proxies browser-facing `/api/*` requests to
  the backend's internal Railway URL, read from an env var at runtime (e.g.
  `BACKEND_INTERNAL_URL` — naming not yet fixed, flagging so you can confirm
  or rename before it's referenced in more than one place). This is also the
  same URL the `/dashboard` layout's direct server-side `fetch` (§3) targets.
- Build/start commands map directly to the existing `package.json` scripts:
  `npm run build` then `npm run start`.
- CI/CD: Railway's GitHub integration auto-deploys this service on push to
  `main`, same as the backend — no separate pipeline.

**Open item, not yet resolved:** the exact env var name(s) the frontend
service needs in Railway, and whether the proxy's cookie-presence
check needs any config at all (it shouldn't — it only inspects the incoming
request, no backend call).
