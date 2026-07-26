# Progress Tracker — Spring Boot backend

This documentation contains mostly OS agnostic steps but since I'm using MacOS some steps specific to MacOS. 

## 1. Tech stack

- Java 25
- Spring Boot 4 (Spring Web, Spring Data JPA (Hibernate), Spring Security)
- MySQL

## 2. Prerequisites (Setup)

### 2.1 Java 25+

**Check if you already have a compatible version:**
```bash
java -version
```
Any version **25 or newer** works — e.g. `openjdk version "25...`. If you
already see one, skip installing anything.

Before installing openjdk@25 via brew, you can check whether it's installed or not via
```bash
brew info openjdk@25
```
Install (macOS, via Homebrew):
```bash
brew install openjdk@25
```


### 2.2 MySQL

**Install (macOS, via Homebrew):**
```bash
brew install mysql
brew services start mysql
```
`brew services start` runs MySQL as a background service that auto-starts on
login. Use `brew services stop mysql` to stop it.

**Check if it's installed / running:**
```bash
mysql --version
brew services list
```
The second command should show `mysql` with a `started` status.

### 2.3 Email provider (Resend)

This project supports OTP based login (I added it for learning purposes rather than password based login).   
So login only works once the app can actually send OTP emails, which needs a real API key from [Resend](https://resend.com) — this app calls Resend's Java SDK directly (HTTP API, not SMTP).   
Set `RESEND_API_KEY` (and optionally `MAIL_FROM`) below to get it working — see [QnA.md](docs/QnA.md#email--smtp) for the full signup/setup walkthrough. Without this, the app still starts, but `/auth/login` will fail whenever it tries to send the code.

## 3. Environment variables (Setup)

Env File: `src/main/resources/application.properties`

(written as `${VAR_NAME:default}` — meaning "use this env var if set, otherwise fall back to the default.")

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/progress_tracker` | JDBC connection string |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | `root` | Database password |
| `JWT_SECRET` | a placeholder dev value | Signing key for access tokens — **must** be overridden for any real deployment |
| `JWT_ACCESS_TTL_MINUTES` | `15` | How long an access token stays valid |
| `JWT_REFRESH_TTL_DAYS` | `30` | How long a refresh token stays valid |
| `OTP_TTL_MINUTES` | `10` | How long a login OTP code stays valid |
| `OTP_MAX_ATTEMPTS` | `5` | Failed OTP attempts allowed before lockout |
| `OTP_RESEND_COOLDOWN_SECONDS` | `60` | Minimum wait between OTP resend requests |
| `RESEND_API_KEY` | *(empty)* | API key for Resend's Java SDK, used to send OTP emails (see [QnA.md](docs/QnA.md#email--smtp)) |
| `MAIL_FROM` | `onboarding@resend.dev` | The "From" address recipients see. The default is Resend's built-in test sender - it works without any domain verification, but only delivers to your own Resend account's email. Swap for a `noreply@yourdomain.com`-style address once you've verified a domain. |
| `LOG_MAX_BACKDATE_DAYS` | `30` | How many days back a log entry can be dated |

The defaults are enough to start the app locally, but `JWT_SECRET` and
`RESEND_API_KEY` should always be set to real values outside of local dev —
without a real API key, login emails fail to send.

## 4. Running locally

Two options — running using docker, or running using maven

### Option A: run with Docker Compose

The [Dockerfile](Dockerfile) containers *only the app itself*, not a
database, so [docker-compose.yml](docker-compose.yml) defines both the app
and a MySQL container together, on a shared network Compose creates
automatically, with a named volume so the database survives restarts:

```bash
docker compose up --build
```

That's it — Compose builds the app image, starts MySQL first, waits for it
to be healthy, then starts the app pointed at it (`DB_URL=jdbc:mysql://mysql:3306/...`,
where `mysql` resolves via Compose's internal DNS to the database
container). `Ctrl+C` to stop both; `docker compose down` also removes the
containers (the `mysql-data` volume persists unless you add `-v`).

This is useful for testing the exact artifact that will actually get
deployed, since it runs the same image the deploy platform builds.

To use real secrets (a real `JWT_SECRET`, a real Resend API key) instead of
the local-dev defaults baked into `docker-compose.yml`, create a `.env` file
next to it (already gitignored) — Compose loads it automatically:
```bash
# .env
JWT_SECRET=<a real generated secret - see docs/QnA.md, NOT this placeholder text>
RESEND_API_KEY=<your Resend API key>
MAIL_FROM=noreply@yourdomain.com
```

### Option B: run directly with Maven

1. Complete the prerequisites above.
2. Create the database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE progress_tracker"
   ```
3. Start the app:
   ```bash
   ./mvnw spring-boot:run
   ```
   Runs on `http://localhost:8080`. Tables are auto-created on startup
   (`spring.jpa.hibernate.ddl-auto=update`).

## Project structure

Organized **by layer**, not by feature:

```
src/main/java/com/progresstracker/
├── controller/   HTTP routes (@RestController)
├── service/      business logic
├── repository/   Spring Data JPA interfaces (DB access)
├── entity/       @Entity classes (DB tables)
├── dto/          request/response records for the API
├── exception/    ApiException + GlobalExceptionHandler
├── config/       typed @ConfigurationProperties
└── security/     JWT filter, cookie handling, Spring Security config
```

## Deployment

Ships as a Docker container (see [Dockerfile](Dockerfile)), so it can run on
any platform that can build and run a Dockerfile — a PaaS (Railway, Render,
Fly.io, etc.), a VPS, or your own Kubernetes cluster. None of the app's
config is hardcoded; everything it needs is supplied at runtime as
[environment variables](#environment-variables), so deploying somewhere new
is just: point the platform at this Dockerfile, give it a reachable MySQL
instance, and set the env vars above (`DB_URL`, `JWT_SECRET`,
`RESEND_API_KEY`, at minimum).

## Misc
- See [MVN_COMMANDS.md](MVN_COMMANDS.md) for every maven command used in this
project and what each one does.

- See [docs/QnA.md](docs/QnA.md) for deeper "why/how" notes on this project —
SMTP provider setup, Docker/Compose concepts, secrets management in
production, etc.

- See [bruno/](bruno) for a [Bruno](https://www.usebruno.com) API collection
covering every endpoint (auth, goals, logs, profile, public profile). Open
the `bruno/` folder as a collection in the Bruno app, select the `local`
environment, and run requests top-to-bottom starting with `auth/login` —
Bruno's cookie jar and a couple of post-response scripts handle the
login/goal/log id chaining automatically. The one manual step: after
`auth/login`, check your inbox (or SMTP provider's log) for the OTP and set
the `otp` environment variable before running `auth/verify-otp`.