# AGENT.md — gainsight-sync-ms

Guidance for AI agents (and new developers) working in this repository.

---

## Project overview

`gainsight-sync-ms` is a **NestJS microservice** that runs on the Cumulocity IoT platform. It periodically fetches user analytics data from the [Gainsight PX](https://www.gainsight.com/product-experience/) API, caches it in memory, and exposes REST endpoints consumed by dashboards.

Core responsibilities:
1. **Scheduled cache refresh** (every 10 minutes) — pulls active users, custom events, page views, and session events from Gainsight PX for all configured tenant domains.
2. **REST API** — serves cached data to authenticated callers over Basic Auth.
3. **Tenant routing** — maps Cumulocity user accounts to their allowed Gainsight domains via a tenant option (`gainsight/config`).

---

## Tech stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript |
| Framework | NestJS 11 |
| C8Y SDK | `@c8y/client` |
| Scheduling | `@nestjs/schedule` (cron) |
| Date math | `date-fns` |
| Filtering | `filtrex` (safe expression compiler) |
| Dev proxy | `http-proxy-middleware` |

---

## pnpm scripts

```bash
pnpm run start:dev      # DEV_MODE=true + hot-reload (watch mode)
pnpm run start:debug    # Debug + hot-reload (no DEV_MODE)
pnpm run start:prod     # Run compiled dist/main.js (production)
pnpm run build          # Compile TypeScript → dist/
pnpm run build:image    # Build Docker image + zip for C8Y upload
pnpm run docker:run     # Run local Docker image with .env file
pnpm run test           # Jest unit tests
pnpm run test:cov       # Jest with coverage report
pnpm run lint           # ESLint with auto-fix
pnpm run docs:build     # Generate OpenAPI HTML docs
pnpm run openapi:generate  # Start app in dev mode and emit docs/openapi.json
pnpm run openapi:html      # Build single-file HTML docs from docs/openapi.json
```

---

## Environment variables

Create a `.env` file in the project root. All variables are read via `dotenv/config` at startup.

### Required in all modes

| Variable | Description |
|---|---|
| `C8Y_BASEURL` | Base URL of the target Cumulocity tenant (e.g. `https://mytenant.cumulocity.com`) |
| `C8Y_TENANT` | Tenant ID (e.g. `t12345`) |
| `C8Y_USER` | Admin/service user login (without tenant prefix) |
| `C8Y_PASSWORD` | Password for the above user |

### Required in production (optional in dev mode)

| Variable | Description |
|---|---|
| `C8Y_BOOTSTRAP_TENANT` | Tenant for the microservice bootstrap user |
| `C8Y_BOOTSTRAP_USER` | Bootstrap username |
| `C8Y_BOOTSTRAP_PASSWORD` | Bootstrap password |

### Optional

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP listen port | `8080` in dev, `80` in prod |
| `DEV_MODE` | Enable dev mode (`true`/`false`) — set automatically by `start:dev` | `false` |
| `C8Y_MICROSERVICE_NAME` | Name of the microservice application in C8Y | `gainsight-sync-ms` |

---

## Dev mode

Activated by `pnpm run start:dev` (sets `DEV_MODE=true`).

### Behavioural differences vs production

| Area | Production | Dev mode |
|---|---|---|
| Scheduler time range | Last 90 days | Random number of milliseconds backward (up to 7 days) via `subMilliseconds` |
| Scheduler reruns | Runs every 10 min indefinitely | Runs once; subsequent cron ticks are skipped after first `lastRun` is set |
| Domain source | Reads `gainsight/config` tenant option | Returns `[{ url: C8Y_BASEURL, id: C8Y_TENANT }]` directly |
| Auth guard | Validates user against domain config | Validates Basic Auth header format only; skips domain permission checks |
| Listen port | `80` (or `$PORT`) | `8080` (or `$PORT`) |
| Proxy | Not mounted | `/proxy/*` forwards to `C8Y_BASEURL` with injected Basic Auth header |

### Bootstrap credential resolution

In **dev mode**, `C8yClientProviderService.getBootstrapClient()` uses `C8yBootstrapService` to dynamically resolve bootstrap credentials:

1. Authenticates with `@c8y/client` using `C8Y_TENANT` / `C8Y_USER` / `C8Y_PASSWORD`.
2. Calls `client.application.list()` to find the application named `gainsight-sync-ms` (or `C8Y_MICROSERVICE_NAME`).
3. Calls `client.application.getBootstrapUser(appId)` to retrieve `{ tenant, name, password }`.
4. Authenticates a new `Client` with those bootstrap credentials.

In **production**, `getBootstrapClient()` routes to `Client.getMicroserviceSubscriptions(...)` using the explicit `C8Y_BOOTSTRAP_*` env vars.

### Local proxy

When dev mode is active, all requests to `http://localhost:8080/proxy/<path>` are forwarded to `C8Y_BASEURL/<path>` with the `Authorization: Basic <tenant/user:password>` header injected automatically. Useful for testing C8Y API calls from the browser or Postman without managing tokens manually.

---

## Key services

| Service | File | Role |
|---|---|---|
| `DevModeService` | `src/service/dev-mode.service.ts` | Central `isDevModeEnabled()` flag; inject this instead of reading `process.env.DEV_MODE` directly |
| `C8yBootstrapService` | `src/service/c8y-bootstrap.service.ts` | Resolves bootstrap user credentials from C8Y application APIs |
| `C8yClientProviderService` | `src/service/c8y-client-provider.service.ts` | Factory for C8Y `Client` instances (direct user client + bootstrap client) |
| `ConfigurationService` | `src/service/configuration.service.ts` | Resolves allowed `{ url, id }` domain list per user or globally |
| `SchedulerService` | `src/service/scheduler.service.ts` | Cron-driven cache refresh coordinator |
| `SettingsService` | `src/service/settings.service.ts` | Typed read/write wrapper for C8Y tenant options |
| `GainsightPxService` | `src/service/gainsight-px.service.ts` | HTTP client for the Gainsight PX REST API |
| `FilterService` | `src/service/filter.service.ts` | Compiles and applies `filtrex` filter expressions to arrays |

---

## Module structure

```
AppModule
├── BootstrapModule          (C8yClientProviderService, C8yBootstrapService)
├── ScheduleModule
├── providers
│   ├── DevModeService
│   ├── GainsightPxService   (async factory — resolves API key from tenant options)
│   ├── *CacheService × 4
│   ├── SchedulerService
│   ├── ConfigurationService
│   ├── SettingsService
│   └── FilterService
└── controllers
    ├── AppController                 (/health, /lastRun)
    ├── LlmController                 (/llms.txt, /llms-full.txt)
    ├── ActiveUserController          (V1 active users + metrics)
    ├── ActiveUserControllerV2        (/v2/activeUsers)
    ├── EventsController              (V1 events)
    ├── EventsControllerV2            (/v2/events, /v2/customEvents)
    ├── SessionEventsController       (V1 session events)
    ├── SessionEventsControllerV2     (/v2/sessionEvents)
    ├── PageViewController            (V1 page views)
    └── PageViewControllerV2          (/v2/pageViews)
```

---

## Auth guard (`TenantGuard`)

Applied to all analytics controllers via `@UseGuards(TenantGuard)`.

- Requires `Authorization: Basic <base64>` header — always.
- Requires `?tenantId=<id>` query parameter — always.
- **In dev mode:** returns `true` after validating header format (no domain lookup).
- **In production:** calls `ConfigurationService.getDomainsForUser(username)` and rejects if `tenantId` is not in the user's allowed domains.

---

## Adding a new analytics endpoint

1. Add a method to the relevant cache service (`src/cache/`).
2. Add a `@Get(...)` route on the relevant controller (`src/api/`).
3. Guard is inherited from the `@UseGuards(TenantGuard)` class decorator — no extra wiring needed.
4. Register any new injectable in `AppModule` providers if it is a new class.

---

## Testing

Unit tests live beside source files as `*.spec.ts`. Key patterns:

- **Instantiate directly** rather than using `Test.createTestingModule` for simple controller/service tests.
- **Inject real `FilterService`** in controller tests — it has no external dependencies.
- **Mock cache services** with `{ queryCache: jest.fn() }`.

```bash
pnpm test                                   # all unit tests
pnpm test custom-events.controller         # single spec file
pnpm run test:cov                           # with coverage
```

---

## Build & deploy

```bash
pnpm run build           # compile
pnpm run build:image     # build Docker image + produce gainsight-sync-ms.zip
```

The zip (`scripts/build.sh`) contains `cumulocity.json` + the Docker image tar and is uploaded directly to Cumulocity as a microservice.

Production bootstrap credentials (`C8Y_BOOTSTRAP_*`) are injected by the platform automatically when the microservice container starts — they do **not** need to be set manually in production.

---

## Git hygiene and agent guidance

- Keep `.gitignore` updated; ignore generated files, local secrets, and IDE metadata.
- Store environment overrides in `.env.local`, and never commit secrets.
- Run `pnpm run lint`, `pnpm test`, and `pnpm run build` before creating a PR.
- Follow existing architecture with per-tenant caches, scheduler jobs, and guarded API endpoints.

