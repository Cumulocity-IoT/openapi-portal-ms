# OpenAPI Portal Microservice

A NestJS Cumulocity microservice that hosts and renders multiple OpenAPI specs. Register specs from remote URLs or direct upload; browse them via [Redoc](https://github.com/Redocly/redoc) or Swagger UI.

## Features

- Register OpenAPI specs by URL (with TTL auto-refresh) or by uploading the JSON directly
- Browse all specs via a portal index page
- View each spec with **Redoc** (read-only, three-panel layout) or **Swagger UI** (interactive, lets you execute requests)
- Admin API protected by Cumulocity authentication (bypassed in dev mode)
- Pre-populate specs at startup via `OPENAPI_SPECS` environment variable — specs reload automatically on every restart
- LLM-friendly `/llms.txt` endpoint summarising all registered specs

> **Spec storage is in-memory only.** Specs registered via the API are lost on restart. Use `OPENAPI_SPECS` to make them persistent across restarts.

---

## Local Development

### Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 10+

### Install and start

```bash
pnpm install
pnpm start
```

The server starts on **port 8080** with `DEV_MODE=true` — no auth checks.

To pre-populate specs at startup:

```bash
OPENAPI_SPECS='[{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json"}]' \
pnpm start
```

### Endpoints (local)

| URL | Description |
|-----|-------------|
| `http://localhost:8080/` | Portal index — lists all registered specs |
| `http://localhost:8080/specs/:id/redoc` | Redoc viewer (read-only, clean layout) |
| `http://localhost:8080/specs/:id/swagger` | Swagger UI viewer (interactive, execute requests) |
| `http://localhost:8080/specs/:id/openapi.json` | Raw OpenAPI JSON |
| `http://localhost:8080/specs` | JSON list of all registered specs |
| `http://localhost:8080/llms.txt` | Plain-text LLM summary of all specs |
| `http://localhost:8080/health` | Health check with spec count |
| `http://localhost:8080/api/` | Portal's own API docs (Swagger UI) |

### Register a spec at runtime

No `Authorization` header required in dev mode.

```bash
# From a remote URL — fetches immediately, auto-refreshes every ttlMs milliseconds
curl -X POST http://localhost:8080/admin/specs \
  -H "Content-Type: application/json" \
  -d '{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json","ttlMs":3600000}'

# From an inline JSON payload
curl -X POST http://localhost:8080/admin/specs \
  -H "Content-Type: application/json" \
  -d '{"id":"myapi","label":"My API","content":{...openapi json...}}'

# List all registered specs
curl http://localhost:8080/admin/specs

# Force re-fetch a URL-backed spec immediately
curl -X POST http://localhost:8080/admin/specs/petstore/refresh

# Delete a spec
curl -X DELETE http://localhost:8080/admin/specs/petstore
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEV_MODE` | `false` | Skip auth checks; use port 8080 |
| `OPENAPI_SPECS` | — | JSON array of specs to load at startup (see format below) |
| `PORT` | `8080` (dev) / `80` (prod) | Listening port |
| `C8Y_BASEURL` | — | Cumulocity tenant URL — auto-injected when deployed as a microservice |

### `OPENAPI_SPECS` format

```json
[
  {
    "id": "petstore",
    "label": "Petstore",
    "url": "https://petstore3.swagger.io/api/v3/openapi.json",
    "ttlMs": 3600000
  },
  {
    "id": "internal",
    "label": "Internal API",
    "content": { "openapi": "3.0.0" }
  }
]
```

Fields `url` and `content` are mutually exclusive. `ttlMs` is optional (default: 1 hour) and only applies to URL-backed specs.

---

## Testing

```bash
pnpm test           # unit tests
pnpm test:cov       # with coverage
pnpm test:e2e       # end-to-end
```

---

## Cumulocity Deployment

### 1. Build the microservice ZIP

```bash
pnpm build:image
```

Builds a `linux/amd64` Docker image and packages it with `cumulocity.json` into `.tmp/openapi-portal-ms.zip`. Requires Docker with `buildx` support.

### 2. Upload to Cumulocity

1. Open **Administration → Ecosystem → Microservices**
2. Click **Add microservice** and upload `.tmp/openapi-portal-ms.zip`
3. Subscribe the microservice to your tenant

### 3. One-time: disable XSRF validation

Cumulocity's gateway validates the `X-XSRF-TOKEN` header for OAI-Secure sessions. Regular browser navigation does not send this header, so direct browser access to the microservice URL is blocked with a 401 unless XSRF validation is disabled at the tenant level.

Run this once as a tenant admin:

```bash
c8y tenantoptions create --category jwt --key xsrf-validation.enabled --value false
```

Or via REST:

```bash
curl -X POST https://<tenant>/tenant/options \
  -u "<tenant>/<user>:<password>" \
  -H "Content-Type: application/json" \
  -d '{"category":"jwt","key":"xsrf-validation.enabled","value":"false"}'
```

> This is the same approach used by [cumulocity-node-red](https://github.com/Cumulocity-IoT/cumulocity-node-red) for the same reason.

### 4. Configure persistent specs via environment variable

Specs registered through the API are held **in-memory only** and lost on every restart. To make specs survive restarts, set `OPENAPI_SPECS` in the microservice settings:

1. Open **Administration → Microservices → openapi-portal-ms → Settings**
2. Add environment variable `OPENAPI_SPECS` with a JSON array value:

```json
[{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json","ttlMs":3600000}]
```

### 5. Access the portal

Once deployed and subscribed, the portal is available at:

```
https://<tenant>/service/openapi-portal-ms/
```

| URL | Description |
|-----|-------------|
| `/service/openapi-portal-ms/` | Portal index |
| `/service/openapi-portal-ms/specs/:id/redoc` | Redoc viewer |
| `/service/openapi-portal-ms/specs/:id/swagger` | Swagger UI viewer |
| `/service/openapi-portal-ms/specs/:id/openapi.json` | Raw OpenAPI JSON |
| `/service/openapi-portal-ms/health` | Health check |

### 6. Register a spec via the admin API

From a browser session (OAI-Secure / SSO):

```bash
curl -X POST https://<tenant>/service/openapi-portal-ms/admin/specs \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json"}'
```

Using Basic Auth:

```bash
curl -X POST https://<tenant>/service/openapi-portal-ms/admin/specs \
  -u "<tenant>/<user>:<password>" \
  -H "Content-Type: application/json" \
  -d '{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json"}'
```

Using the `c8y` CLI:

```bash
c8y api POST /service/openapi-portal-ms/admin/specs \
  --data '{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json"}'
```

---

## How authentication works

The admin endpoints (`/admin/*`) verify every request by calling `GET /user/currentUser` on the Cumulocity API using the caller's credentials. This works for both authentication methods:

- **OAI-Secure (browser / SSO):** the `authorization` JWT cookie is forwarded as `Authorization: Bearer <jwt>`
- **Basic Auth / Bearer header:** the `Authorization` header is forwarded as-is

`C8Y_BASEURL` is injected automatically by Cumulocity (`http://cumulocity:8111`) and used for the internal verification call. In `DEV_MODE` the guard is bypassed entirely.

---

## Generate the portal's own OpenAPI spec

```bash
pnpm openapi:generate   # writes docs/openapi.json
pnpm openapi:html       # renders docs/openapi.json → docs/index.html (Redoc)
```

---

## Contributing

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

Do not commit `.env` files or secrets.
