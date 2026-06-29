# OpenAPI Portal Microservice

A NestJS Cumulocity microservice that hosts and renders multiple OpenAPI specs. Register specs from remote URLs or direct upload; browse them via Redoc or Swagger UI.

## Features

- Register OpenAPI specs by URL (with TTL auto-refresh) or by uploading the JSON directly
- Browse all specs via a portal index page
- View each spec with Redoc or Swagger UI
- Admin API protected by Cumulocity Basic Auth (bypassed in dev mode)
- Pre-populate specs at startup via an environment variable
- LLM-friendly `/llms.txt` endpoint summarising all registered specs

---

## Local Development

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+

### Install dependencies

```bash
pnpm install
```

### Start the dev server

```bash
pnpm start
```

The server starts on **port 8080** with `DEV_MODE=true` (no auth checks).

To pre-populate specs at startup, pass the `OPENAPI_SPECS` environment variable:

```bash
OPENAPI_SPECS='[{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json"}]' \
pnpm start
```

### Endpoints

| URL | Description |
|-----|-------------|
| `http://localhost:8080/` | Portal index — lists all registered specs |
| `http://localhost:8080/api/` | Portal's own API docs (Swagger UI) |
| `http://localhost:8080/health` | Health check with spec count |
| `http://localhost:8080/specs` | JSON list of registered specs |
| `http://localhost:8080/specs/:id/redoc` | Redoc viewer for a spec |
| `http://localhost:8080/specs/:id/swagger` | Swagger UI viewer for a spec |
| `http://localhost:8080/specs/:id/openapi.json` | Raw OpenAPI JSON |
| `http://localhost:8080/llms.txt` | Plain-text LLM summary of all specs |

### Register a spec at runtime

In dev mode no `Authorization` header is required.

```bash
# From a remote URL (auto-refreshes every ttlMs milliseconds)
curl -X POST http://localhost:8080/admin/specs \
  -H "Content-Type: application/json" \
  -d '{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json","ttlMs":3600000}'

# From an inline payload
curl -X POST http://localhost:8080/admin/specs \
  -H "Content-Type: application/json" \
  -d '{"id":"myapi","label":"My API","content":{...openapi json...}}'

# List all specs
curl http://localhost:8080/admin/specs

# Force refresh a URL-backed spec
curl -X POST http://localhost:8080/admin/specs/petstore/refresh

# Delete a spec
curl -X DELETE http://localhost:8080/admin/specs/petstore
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEV_MODE` | `false` | Skip auth checks and use `DEV_MODE_DOMAIN_*` for bootstrap |
| `OPENAPI_SPECS` | — | JSON array of `RegisterSpecDto` objects to load at startup |
| `PORT` | `8080` (dev) / `80` (prod) | Listening port |
| `C8Y_BASEURL` | — | Cumulocity tenant base URL |
| `C8Y_TENANT` | — | Cumulocity tenant ID |
| `C8Y_USER` | — | Cumulocity service user |
| `C8Y_PASSWORD` | — | Cumulocity service user password |

Copy `sample.env` to `.env` and fill in the values for non-dev use.

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
    "content": { "openapi": "3.0.0", "..." : "..." }
  }
]
```

---

## Testing

```bash
pnpm test           # unit tests
pnpm test:cov       # unit tests with coverage report
pnpm test:e2e       # end-to-end tests
```

---

## Cumulocity Deployment

### 1. Build the microservice ZIP

```bash
pnpm build:image
```

This builds a `linux/amd64` Docker image and packages it with `cumulocity.json` into `.tmp/openapi-portal-ms.zip`.

Requires Docker with `buildx` support.

### 2. Upload to Cumulocity

1. Open **Administration → Ecosystem → Microservices**
2. Click **Add microservice** and upload `.tmp/openapi-portal-ms.zip`
3. Subscribe the microservice to your tenant

### 3. Configure specs

Set the `OPENAPI_SPECS` environment variable in the microservice configuration (Administration → Microservices → openapi-portal-ms → Settings) to pre-populate the registry on startup.

### 4. Auth in production

With `DEV_MODE=false` (the default in production), all `/admin/*` endpoints require a valid Cumulocity `Authorization: Basic <base64>` header.

```bash
curl -X POST https://<tenant>.cumulocity.com/service/openapi-portal-ms/admin/specs \
  -H "Authorization: Basic <base64(user:password)>" \
  -H "Content-Type: application/json" \
  -d '{"id":"myapi","label":"My API","url":"https://..."}'
```

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
