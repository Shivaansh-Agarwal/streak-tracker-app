# Learn in Public - Streak Tracker

## Summary

- A webapp for tracking daily learning activities. 
- You can set goals, and then add learning logs linked to a goal.
- You can view your daily progress as a monthly day-wise-heatmap.
- Every user gets a public profile page so you can share your streak with others.

## Stack

- **Frontend:** Next.js 16
- **Backend:** Java 25, Spring Boot 4, MySQL
- **Hosting:** Railway (frontend, backend, MySQL as three separate services, $5/month hobby plan)

## Try it out

**Live app:** https://nexjs-fe-production.up.railway.app/

Login is OTP-only. Enter your email, a code lands in your inbox, you enter it and
you're in. There's no password anywhere in this app.

- You can either use your own email and setup a new account.   
[OR]   
- I've added 2 demo accounts. Use either of the 2 emails below and
enter `123456` as the OTP, no real email gets sent for these:
  - `johndoe@gmail.com`
  - `janedoe@yahoo.com`

You can also view their public profiles without logging in:
- https://nexjs-fe-production.up.railway.app/u/johndoe
- https://nexjs-fe-production.up.railway.app/u/janedoe

## Project layout

The project contains both the backend and frontend code.

```
backend/
  springboot/

frontend/
  nextjs16/
```

## Running it locally

Setup steps for backend and frontend.

- [backend/springboot/README.md](backend/springboot/README.md)
- [frontend/nextjs16/README.md](frontend/nextjs16/README.md)

Run the backend first, then the frontend, since the frontend proxies API calls
to it.

## Design docs

Written before writing any code, kept here for reference:

- [01-problem-statement.md](01-problem-statement.md) - the original requirements
- [02-backend-hld.md](02-backend-hld.md) - backend design, schema, API contract, auth flow
- [03-frontend-hld.md](03-frontend-hld.md) - frontend design, routes, pages

Deeper "why" notes on specific decisions (JWT secrets, email setup, Docker, secrets
in production) are in [backend/springboot/docs/QnA.md](backend/springboot/docs/QnA.md).
