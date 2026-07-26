# QnA (with AI)
A documentation for learning and questions (noob to advanced) encountered while building this project.

---

## General

### How to generate a `JWT_SECRET` key?

Unlike `DB_*` or `MAIL_*` env vars, `JWT_SECRET` isn't issued by any
third-party service — it's a random secret string **you generate yourself**.
It's the key this app uses to cryptographically sign and verify its own JWTs
(see [JwtService.java](src/main/java/com/progresstracker/security/JwtService.java)),
so nothing external needs to recognize it; it only needs to be long, random,
and kept secret.

Generate one with:
```bash
openssl rand -base64 32
```

**Why it can't just be any string** — this project uses HMAC-SHA signing
(via the `io.jsonwebtoken`/JJWT library), which enforces a hard minimum key
length of **256 bits (32 bytes)** per RFC 7518. Anything shorter throws a
`WeakKeyException` — and since the key is built when `JwtService` is
constructed, that exception happens during Spring's startup, so the app
fails to boot entirely rather than just running insecurely. Tested directly
against this project's JJWT dependency:

```
Secret: "test@1234" -> 9 bytes, 72 bits
FAILED: WeakKeyException: The specified key byte array is 72 bits which is
not secure enough for any JWT HMAC-SHA algorithm... keys used with
HMAC-SHA algorithms MUST have a size >= 256 bits
```

`openssl rand -base64 32` produces 32 random bytes (256 bits) encoded as
~44 base64 characters — comfortably above the floor.

**A few rules for using it:**
- Set it as an environment variable, never commit it to a file:
  ```bash
  export JWT_SECRET="<the generated value>"
  ```
- Don't reuse the same secret across different projects/deployments —
  anyone holding it can forge valid tokens for that specific app.
- The default in `application.properties` is a placeholder dev value —
  fine for local development, but must be overridden before any real
  deployment.

---

## Email / SMTP

### How do I set up Resend so OTP login emails actually send?

Login works by emailing a one-time code. This app calls
[Resend](https://resend.com)'s **Java SDK directly over HTTP** (the
`com.resend:resend-java` dependency, used in `MailService`) — not SMTP.
Earlier iterations of this project went through Spring's `JavaMailSender`
over SMTP (`smtp.resend.com`), but it was switched to Resend's own SDK,
which only needs one API key, no SMTP host/port/username juggling. The
README only lists which env vars to set
([Environment variables](../README.md#3-environment-variables)); this is the
full walkthrough.

### Setting up Resend

Resend has a generous free tier (3,000 emails/month). There are two ways to
get a working `MAIL_FROM`, depending on whether you own a domain yet:

**Without a domain (fastest, for local testing):** use Resend's built-in
test sender, `onboarding@resend.dev` — this is the default in
`application.properties` already. It requires no setup beyond an API key,
but Resend restricts it to only deliver to **your own account's email
address** (whatever email you signed up to Resend with) — fine for testing
solo, not useful once other people need to log in.

**With a verified domain (for a real login flow anyone can use):**
1. Buy a cheap domain if you don't already have one (see
   [Reusing one domain across projects](#reusing-one-domain-across-projects)
   below).
2. In the Resend dashboard, go to **Domains → Add Domain**, enter it, and add
   the DNS records it gives you (an SPF `TXT` record and a DKIM `TXT` record)
   at your registrar's DNS panel (e.g. Cloudflare's dashboard if that's where
   you bought it).
3. Wait for the domain's status to flip to **Verified** in the dashboard
   (usually a few minutes, sometimes longer for DNS to propagate).
4. Set `MAIL_FROM` to an address at that domain, e.g. `noreply@yourdomain.com`.

**Either way**, get the API key from **API Keys → Create API Key** in the
Resend dashboard, and set:
```bash
RESEND_API_KEY=<your Resend API key>
MAIL_FROM=onboarding@resend.dev   # or noreply@yourdomain.com once verified
```

**A real mistake this project hit**: the README's example `.env` snippet
originally had `JWT_SECRET=<your generated secret>` as literal placeholder
text — copy-pasting it verbatim (instead of substituting a real generated
secret) is only 23 bytes, which fails JJWT's 256-bit minimum and crashes the
app at startup with a `WeakKeyException`. Always replace bracketed
placeholders with real values, never copy them as-is.

### Reusing one domain across projects

Rather than re-verifying a personal email address for every hobby project,
buying one cheap domain (e.g. via [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)
or [Porkbun](https://porkbun.com), ~$10/year) and verifying the **domain**
once with Resend lets you send from any `@yourdomain.com` address —
`noreply@yourdomain.com` for this project, a different address for the next
one — without repeating verification each time.

Without one of these set up, the app still starts fine —
`POST /auth/login` will just fail when it tries to send the OTP email.

---

## Docker

### What is Docker?

Docker packages an application together with everything it needs to run —
the JDK, OS libraries, config — into a single portable unit, so it behaves
identically on your laptop, a teammate's machine, or a cloud server. Instead
of "install Java 25, install this exact MySQL version, hope the versions
match production," you build one artifact once and run it anywhere Docker
is installed. It solves the classic "works on my machine" problem.

### What is a Docker image?

A **read-only blueprint** — a snapshot of a filesystem plus instructions for
how to run it, built from a `Dockerfile`. An image is not running anything;
it's the packaged, shareable artifact, like a class in Java vs. an object.
This project's image, for example, bundles: a JRE, this app's compiled
`.jar`, and the instruction to run `java -jar app.jar` on startup. Images
are typically stored in a registry (Docker Hub, GitHub Container Registry,
etc.) so they can be pulled down and run elsewhere.

### What is a Docker container?

A **running instance of an image** — the "object" to the image's "class."
You can start multiple containers from the same image (each isolated from
the others, with its own filesystem changes, network, and process space),
and stopping/removing a container doesn't affect the image it came from —
start a fresh container from that same image and you're back to a clean
slate. When [docker-compose.yml](docker-compose.yml) runs `docker compose up`,
it's creating two containers — `app` and `mysql` — from two images.

### What does [Dockerfile](Dockerfile) do?

It's the recipe for building this project's **app image**, in two stages:

```dockerfile
# --- Build stage ---
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# --- Runtime stage ---
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- **Build stage** (`eclipse-temurin:25-jdk`) — starts from a full JDK image
  (needed to *compile* code), copies in just the Maven wrapper and `pom.xml`
  first and runs `dependency:go-offline` *before* copying the actual source
  code. This ordering is deliberate: Docker caches each instruction as a
  layer, and this way, if you only change Java source (not `pom.xml`),
  Docker reuses the cached "downloaded all dependencies" layer instead of
  re-downloading everything on every build. Then it copies `src/` and runs
  the real Maven build (`clean package -DskipTests`, skipping tests since
  this is a build step, not a test-verification step).
- **Runtime stage** (`eclipse-temurin:25-jre-alpine`) — starts fresh from a
  much smaller image containing only a **JRE** (can run Java, can't compile
  it) on Alpine Linux (a minimal Linux distro), and copies in *just the
  built jar* from the build stage — none of the JDK, Maven, or source code
  come along. This "multi-stage build" pattern keeps the final image small,
  since nothing needed only for compiling ships in the artifact that
  actually gets deployed.
- **`EXPOSE 8080`** — documents that the container listens on port 8080
  (informational; doesn't actually publish the port — that's what `-p` on
  `docker run`, or `ports:` in Compose, is for).
- **`ENTRYPOINT`** — the command that runs when a container starts from
  this image: `java -jar app.jar`.

### What does [docker-compose.yml](docker-compose.yml) do?

Where the `Dockerfile` describes *one* image, Compose describes **how
multiple containers work together** — here, this app plus a MySQL database,
as two `services`:

- **`mysql` service** — runs the official `mysql:8` image (no custom
  Dockerfile needed, it's pulled straight from Docker Hub), seeded with
  `MYSQL_ROOT_PASSWORD`/`MYSQL_DATABASE` env vars the image itself knows how
  to read. `volumes: - mysql-data:/var/lib/mysql` mounts a **named volume**
  — storage that lives outside the container — at the path MySQL keeps its
  data files, so the database survives the container being removed and
  recreated (without this, `docker compose down` would wipe all data).
  `healthcheck` tells Docker how to determine when MySQL is actually ready
  to accept connections (not just "the process started"), by periodically
  running `mysqladmin ping` inside the container.
- **`app` service** — `build: .` means "build this from the `Dockerfile` in
  this directory" rather than pulling a pre-made image. Its `environment:`
  block sets the same env vars documented in the README's
  [Environment variables](README.md#environment-variables) section, using
  `${VAR:-default}` syntax — Compose's equivalent of the
  `${VAR:default}` placeholders in `application.properties` — so anything
  exported in your shell or a `.env` file overrides the fallback shown.
  Notably `DB_URL` points at host `mysql`, not `localhost` — see below.
- **`depends_on: mysql: condition: service_healthy`** — makes Compose start
  `app` only after `mysql`'s healthcheck passes, avoiding a race where the
  app tries to connect before the database is ready to accept connections.
- **`volumes: mysql-data:`** (top-level) — declares the named volume used
  above; Compose manages its actual location on disk.
- **Networking** — Compose automatically creates a private network shared
  by every service in the file, and gives each service a DNS entry matching
  its service name. That's why `DB_URL=jdbc:mysql://mysql:3306/...` works:
  `mysql` isn't a real hostname anywhere except inside this Compose
  network, where it resolves to the `mysql` container.

### Common Docker commands worth knowing

| Command | What it does |
|---|---|
| `docker build -t <name> .` | Build an image from a `Dockerfile` in the current directory |
| `docker run <image>` | Start a new container from an image |
| `docker run -p 8080:8080 <image>` | ...and map container port 8080 to host port 8080 |
| `docker run -d <image>` | ...running in the background ("detached") instead of tying up your terminal |
| `docker run --rm <image>` | ...and auto-remove the container once it stops (good for throwaway test runs) |
| `docker ps` | List running containers |
| `docker ps -a` | List *all* containers, including stopped ones |
| `docker images` | List images you have locally |
| `docker logs <container>` | View a container's logs |
| `docker exec -it <container> <cmd>` | Run a command inside an already-running container (e.g. `docker exec -it mysql mysql -uroot -p` to get a MySQL shell) |
| `docker stop <container>` | Stop a running container |
| `docker rm <container>` | Remove a stopped container |
| `docker rmi <image>` | Remove an image |
| `docker network create <name>` | Create a shared network so containers can reach each other by name |
| `docker volume create <name>` | Create a named volume for persistent data |
| — | |
| `docker compose up` | Build (if needed) and start every service in `docker-compose.yml` |
| `docker compose up --build` | ...forcing a rebuild of images first |
| `docker compose up -d` | ...in the background |
| `docker compose down` | Stop and remove all containers + the network Compose created |
| `docker compose down -v` | ...and also delete named volumes (⚠️ deletes persisted data, e.g. the database) |
| `docker compose ps` | List this project's containers and their status |
| `docker compose logs <service>` | View logs for one service (e.g. `docker compose logs app`) |
| `docker compose exec <service> <cmd>` | Run a command inside a running Compose service |

---

## Deployment

### How do I manage secrets (`.env`) in production, e.g. on AWS or Railway?

`.env` is purely a **local Docker Compose convenience** — Compose reads it
off disk and injects its values as env vars into containers it starts. It
never gets deployed anywhere (it's gitignored, and no cloud platform reads
a `.env` file out of your repo). In production, each platform has its own
place to set environment variables directly, which get injected into the
running container the same way — just managed by the platform's dashboard
instead of a file on your machine.

- **Railway**: service → **Variables** tab → add each key/value (`JWT_SECRET`,
  `RESEND_API_KEY`, etc.) directly in the dashboard. Encrypted at rest,
  injected into the container at startup.
- **AWS** — depends which service is running the container:
  - **ECS/Fargate** (the typical way to run a Docker container on AWS): the
    **Task Definition** has an `environment` list for plain values, and a
    separate `secrets` list that references **AWS Secrets Manager** or
    **Systems Manager Parameter Store** — the real secret value lives there,
    and the task definition only stores a pointer (ARN) to it, so it never
    appears in plain text in your ECS config. Use `environment` for
    non-sensitive values (`OTP_TTL_MINUTES`), `secrets` for `JWT_SECRET` /
    `RESEND_API_KEY`.
  - **Elastic Beanstalk**: **Configuration → Software → Environment
    properties** in the console — same key/value UI as Railway.
  - **App Runner**: an "Environment variables" section when configuring the
    service, same idea again.

**The common thread**: this project's code never changes to support any of
these. It's still just reading `${JWT_SECRET:default}` via Spring's normal
env var resolution (see `application.properties`). Only *how the env var
gets set* differs — locally it's `.env` + Compose, in the cloud it's the
platform's dashboard or secrets store injecting it into the container at
boot. That's the whole point of driving config through env vars instead of
hardcoding it: the same image runs anywhere, only the injected values change.
