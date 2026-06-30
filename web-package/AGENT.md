# AGENT.md — swagger-sample-ms

Guidance for AI agents (and new developers) working in this repository.

---

## Project overview

`swagger-sample-ms` is a **NestJS proof-of-concept** showing how to automatically derive an OpenAPI specification from a microservice using Swagger decorators and publish that spec as a hosted HTML page on a Cumulocity tenant — without requiring any login.

Core responsibilities:
1. **REST API** — a simple `ItemsController` demonstrating every relevant `@nestjs/swagger` annotation (`@ApiTags`, `@ApiOperation`, `@ApiQuery`, `@ApiParam`, `@ApiBody`, `@ApiResponse`, `@ApiProperty`).
2. **OpenAPI generation** — boots the app, collects all decorator metadata at runtime, and writes `docs/openapi.json`.
3. **Docs publishing** — builds a self-contained HTML page from the spec and packages it with `docs/cumulocity.json` into a zip that can be uploaded to Cumulocity as a login-free web application.

---

## Tech stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20, TypeScript |
| Framework | NestJS 11 |
| C8Y SDK | `@c8y/client` |
| API docs | `@nestjs/swagger` + `@redocly/cli` |

---

## pnpm scripts

```bash
pnpm run start          # DEV_MODE=true + hot-reload (watch mode)
pnpm run start:debug    # Debug + hot-reload
pnpm run start:prod     # Run compiled dist/main.js (production)
pnpm run build          # Compile TypeScript → dist/
pnpm run build:image    # Build Docker image + zip for C8Y upload
pnpm run docker:run     # Run local Docker image with .env file
pnpm run test           # Jest unit tests
pnpm run test:cov       # Jest with coverage report
pnpm run lint           # ESLint with auto-fix
pnpm run openapi:generate  # Boot app and write docs/openapi.json
pnpm run openapi:html      # Build single-file HTML from docs/openapi.json
pnpm run docs:build        # Run openapi:html then zip for Cumulocity upload
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
| `PORT` | HTTP listen port | `3000` in dev, `80` in prod |
| `DEV_MODE` | Enable dev mode (`true`/`false`) | `false` |
| `DEV_MODE_DOMAIN_URL` | Tenant URL used when `DEV_MODE=true` | — |
| `DEV_MODE_DOMAIN_ID` | Tenant ID used when `DEV_MODE=true` | — |
| `GENERATE_API_DOCS` | Write spec to `docs/openapi.json` and exit | `false` |
| `C8Y_MICROSERVICE_NAME` | Name of the microservice application in C8Y | `swagger-sample-ms` |

---

## Dev mode

Activated by setting `DEV_MODE=true` (done automatically by `pnpm run start`).

`C8yClientProviderService.getBootstrapClient()` branches as follows:

1. **If `C8Y_BOOTSTRAP_USER` + `C8Y_BOOTSTRAP_PASSWORD` are set** (production): calls `Client.getMicroserviceSubscriptions(...)` directly with those credentials, picks the first subscribed user, and authenticates a `Client` with it.
2. **If they are absent and `DEV_MODE=true`** (dev fallback): delegates to `C8yBootstrapService` to resolve bootstrap credentials dynamically:
   - Authenticates with `C8Y_TENANT` / `C8Y_USER` / `C8Y_PASSWORD`.
   - Calls `client.application.list()` to find the app named `swagger-sample-ms` (or `C8Y_MICROSERVICE_NAME`).
   - Calls `client.application.getBootstrapUser(appId)` to retrieve `{ tenant, name, password }`.
   - Passes those credentials to `Client.getMicroserviceSubscriptions(...)`, picks the first subscribed user, and authenticates a `Client` with it.
3. **Otherwise**: rejects with "No Bootstrap credentials available".

---

## Key services

| Service | File | Role |
|---|---|---|
| `DevModeService` | `src/service/dev-mode.service.ts` | Central `isDevModeEnabled()` flag |
| `C8yBootstrapService` | `src/service/c8y-bootstrap.service.ts` | Resolves bootstrap user credentials from C8Y application APIs |
| `C8yClientProviderService` | `src/service/c8y-client-provider.service.ts` | Factory for C8Y `Client` instances (direct user client + bootstrap client) |

---

## Module structure

```
AppModule
├── BootstrapModule          (C8yClientProviderService, C8yBootstrapService, DevModeService)
└── controllers
    └── ItemsController      (/items — full CRUD + /items/counts/by-category)
```

---

## Adding a new endpoint

1. Add a DTO class in `src/api/<feature>/<feature>.dto.ts` — annotate every field with `@ApiProperty` or `@ApiPropertyOptional`.
2. Add a `@Get` / `@Post` / `@Put` / `@Delete` route on the controller in `src/api/<feature>/<feature>.controller.ts` — add `@ApiOperation`, `@ApiQuery`/`@ApiParam`/`@ApiBody`, and `@ApiResponse`.
3. Register the controller in `AppModule`.
4. Run `pnpm run openapi:generate` to verify the new endpoint appears in the spec.

---

## Testing

Unit tests live beside source files as `*.spec.ts`.

```bash
pnpm test                 # all unit tests
pnpm run test:e2e         # e2e tests (test/)
pnpm run test:cov         # with coverage
```

---

## Build & deploy

```bash
pnpm run build           # compile
pnpm run build:image     # build Docker image + produce swagger-sample-ms.zip
```

The zip (`scripts/build.sh`) contains `cumulocity.json` + the Docker image tar and is uploaded directly to Cumulocity as a microservice.

For the **docs plugin** (login-free HTML), see `pnpm run docs:build` — that produces `docs/cumulocity-docs.zip` for upload as a web application.

---

## Git hygiene and agent guidance

- Keep `.gitignore` updated; ignore generated files, local secrets, and IDE metadata.
- Store environment overrides in `.env.local`, and never commit secrets.
- Run `pnpm run lint`, `pnpm test`, and `pnpm run build` before creating a PR.

