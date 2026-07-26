# Maven commands used in this project

This project uses the **Maven Wrapper** (`mvnw`), a script checked into the repo
that downloads the exact Maven version this project needs. That's why every
command below starts with `./mvnw` and not `mvn` — you don't need Maven
installed globally, just Java.

Run all of these from inside `backend/springboot/`.

---

## `./mvnw spring-boot:run`

Compiles the app and runs it, all in one step. This is the command you'll use
most often during local development.

- Starts the app on `http://localhost:8080`
- Reads config from `src/main/resources/application.properties`
- Press `Ctrl+C` to stop it
- Requires a running MySQL instance matching your `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`

---

## `./mvnw compile`

Compiles the Java source code only — doesn't run it, doesn't run tests,
doesn't package a jar. The fastest way to check "does my code even compile"
after making changes.

Flags used earlier in this project:
- `-q` — quiet output, only shows errors/warnings instead of Maven's full log
- `-o` — offline mode, skips checking for new dependency versions (faster,
  works without internet once dependencies are already downloaded)

```
./mvnw -q -o compile
```

---

## `./mvnw test`

Runs the test suite (everything under `src/test/java`). Right now that's just
`BackendApplicationTests`, which checks the app's Spring context loads without
errors — but this is the command you'd run before every commit once you add
real tests.

---

## `./mvnw package`

Compiles the code, runs the tests, and bundles everything into a runnable jar
at `target/backend-0.0.1-SNAPSHOT.jar`. Fails if any test fails.

## `./mvnw clean package`

Same as `package`, but first deletes the `target/` folder (`clean`) so you're
building from scratch — no leftover `.class` files from a previous build.
Slower, but safer when something feels stale or inconsistent.

`-DskipTests` skips running the tests during packaging (used in the
[Dockerfile](Dockerfile) so the Docker image build doesn't spend time
re-running tests that should already have passed in CI/locally):

```
./mvnw clean package -DskipTests -B
```

`-B` = "batch mode" — disables interactive prompts/colored progress bars,
which is what you want in a script or CI pipeline instead of a terminal.

---

## `./mvnw dependency:go-offline`

Downloads all of this project's dependencies (and their dependencies) without
compiling or running anything. Used in the [Dockerfile](Dockerfile) as a
separate step *before* copying in the source code — Docker caches this layer,
so if you only change your Java code (not `pom.xml`), rebuilding the image
skips re-downloading every dependency and just recompiles your code. Big
speedup on repeated Docker builds.

```
./mvnw dependency:go-offline -B
```

---

## Quick reference

| Command | What it does | When to use it |
|---|---|---|
| `./mvnw spring-boot:run` | Compile + run the app | Local development |
| `./mvnw compile` | Compile only | Quick "does this even build" check |
| `./mvnw test` | Run tests | Before committing |
| `./mvnw package` | Compile + test + build jar | Producing a runnable artifact |
| `./mvnw clean package` | Same as above, from a clean slate | When a build seems stale/broken |
| `./mvnw dependency:go-offline` | Pre-download dependencies | Docker image build step |

---

## Where these come from

Maven commands follow the shape `mvn <phase-or-goal> [flags]`. Phases
(`compile`, `test`, `package`, `clean`) are steps in Maven's standard build
lifecycle — each one runs all the phases before it too (e.g. `package` also
runs `compile` and `test` first). `spring-boot:run` and `dependency:go-offline`
are different: they're goals from specific plugins
(`spring-boot-maven-plugin`, `maven-dependency-plugin`) rather than lifecycle
phases, which is why they use the `plugin:goal` colon syntax instead of a bare
word.
