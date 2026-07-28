# Next.js frontend

## Prerequisites

- Node.js 20+

## Setup

```bash
cd frontend/nextjs16
npm install
```

## Environment variables

The frontend proxies `/api/*` to the backend (see `next.config.ts`), so the
browser only ever talks to the frontend, same-origin.

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_INTERNAL_URL` | `http://localhost:8080` | Where the backend actually lives. Point this at the Spring Boot backend (see [backend/springboot/README.md](../../backend/springboot/README.md)) |

## Running it

Make sure the backend is running first, then:

```bash
npm run dev
```

Runs on `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```
