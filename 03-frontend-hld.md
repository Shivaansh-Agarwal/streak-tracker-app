# Frontend HLD

Requirements and product decisions live in `01-problem-statement.md` and
`02-backend-hld.md` (schema, API contract, auth model). This doc only covers
how the frontend is built.

## 1. Stack

- Next.js 16, App Router, TypeScript
- React 19 + Tailwind v4

## 2. Routes

| Route | Rendering | Access |
|---|---|---|
| `/` | Static | Public |
| `/login` | Client-rendered | Public. Single email + OTP form for both signup and signin. |
| `/dashboard` | Server component + client content | Private |
| `/u/[handle]` | Server-rendered | Public, read-only |

`/u/[handle]` has two failure states: handle doesn't exist -> 404. Handle
exists but the profile is private -> a distinct "this profile is private"
message.

## 3. Auth

Login is JWT-based. The response of `POST /auth/verify-otp` sets the access
and refresh tokens as cookies in the browser via `Set-Cookie`, not in the
response body. The frontend never stores these tokens anywhere else,
no `localStorage`, no `sessionStorage`.

Both cookies are `httpOnly` (JS on the page can't read them, even via an
XSS payload), `Secure` (only ever sent over HTTPS), and `SameSite=Lax`
(only attached to requests originating from our own site, not a cross-site
request some other page tries to fire at our API).

The browser only ever talks to one origin, the Next.js frontend. It's the
Next.js server, not the browser, that forwards `/api/*` calls internally to
the backend. So there's no real cross-origin request from the
browser's point of view, which is exactly what `SameSite=Lax` needs to hold.

That's also why there's no separate CSRF token: CSRF protection exists
because cookies normally get attached to a request regardless of which page
triggered it. `SameSite=Lax` already stops that from happening cross-site,
so a CSRF token would be defending against an attack that can't occur here.

**Gating `/dashboard`:** `proxy.ts` does a fast reject, redirecting to
`/login` if the access-token cookie is simply missing (it can't verify the
JWT itself). `page.tsx` does the real check, calling `GET /users/me`
server-to-server and redirecting on a `401`.

**Silent refresh:** the access token expires in ~15 minutes. `lib/auth-fetch.ts`
wraps every authenticated client-side call, retries once through
`POST /auth/refresh` on a `401`, and hard-redirects to `/login` if that
fails too.

**Logout:** `POST /auth/logout` revokes the refresh token and clears the
cookies server-side, then the frontend redirects to `/login`.

## 4. Data Fetching

plain `fetch` is used for data fetching for both Server and Client side data fetching.

**Server-side**:  
- Some server components directly fetch data from the backend using backend URL defined in the env variable - `BACKEND_INTERNAL_URL`.
- after login, the cookie will get stored in the browser.
- Usecase 1: when the user requests for the dashboard page from nextjs server, we need to show either the Onboarding flow (Set Profile Details) or the Dashboard Flow - so on the nextjs's server we take out the cookie from the request, and fetch user profile from BE service via `GET /users/me`. Based on this either Onboarding or Dashboard Flow is opened (i've chosen to do this on nextjs server, so as to avoid loading spinner if i would've chosen the complete CSR approach).
- Usecase 2: For the public page too we use the server component. `app/u/[handle]/page.tsx` fetches `GET /public/[handle]` the same way, (no cookie needed since it's a public route - handled on BE).

**Client-side**:    
- inside `"use client"` components, through the browser-facing
`/api/*` proxy. 
- Each resource gets its own hook (`useGoals()`, `useLogs(year, month)`, `useHeatmap(year)`) owning its own `data`/`loading`/`error` state via
`useState` + `useEffect`, calling `lib/auth-fetch.ts` under the hood so token
refresh is handled in one place. 
- This is used for everything the dashboard needs after the initial page load: goals, logs, heatmap data, and any mutation (create/update/delete).

## 5. Deployment

- FE is deployed on Railway - as a node service.
- The service is auto-deployed whenever something is pushed to the `main` branch on Github.
