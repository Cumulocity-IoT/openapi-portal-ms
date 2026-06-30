# OpenAPI Portal MS — Architecture Diagram

## Module dependency graph

```
┌─────────────────────────────────────────────────────────────────┐
│ AppModule                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ BootstrapModule  │  │SpecRegistryMod. │  │ AdminModule  │  │
│  ├──────────────────┤  ├─────────────────┤  ├──────────────┤  │
│  │ providers:       │  │ providers:      │  │ providers:   │  │
│  │ • C8y providers  │  │ • SpecRegistry  │  │ • TenantGuard│  │
│  │ • DevModeService │  │                 │  │              │  │
│  │                  │  │ exports:        │  │ controllers: │  │
│  │ exports:         │  │ • SpecRegistry  │  │ • AdminCtlr  │  │
│  │ • C8y providers  │  │                 │  │              │  │
│  │ • DevModeService │  │                 │  │ imports:     │  │
│  └──────────────────┘  └─────────────────┘  │ • Bootstrap  │  │
│         │                      │             │ • SpecReg    │  │
│         └──────────┬───────────┘             └──────────────┘  │
│                    │                               │            │
│  ┌─────────────────────────────────────────────────┘            │
│  │                                                              │
│  │  ┌──────────────────┐                                        │
│  │  │ DocModule        │                                        │
│  │  ├──────────────────┤                                        │
│  │  │ controllers:     │                                        │
│  │  │ • DocController  │                                        │
│  │  │                  │                                        │
│  │  │ imports:         │                                        │
│  │  │ • SpecRegistry   │                                        │
│  │  └──────────────────┘                                        │
│  │                                                              │
└──────────────────────────────────────────────────────────────────┘
```

## Endpoint map

### Public endpoints (GET only)

```
GET  /                          ← Portal index (HTML spec picker)
GET  /health                    ← Health check + spec count
GET  /specs                     ← List all specs (JSON)
GET  /specs/:id/openapi.json    ← Raw OpenAPI document
GET  /specs/:id/redoc           ← Redoc viewer (CDN)
GET  /specs/:id/swagger         ← Swagger UI viewer (CDN)
GET  /llms.txt                  ← LLM-friendly text summary
GET  /api/                      ← Portal's own OpenAPI docs (auto-generated)
```

### Admin endpoints (guarded by TenantGuard)

```
GET    /admin/specs             ← List all specs with metadata
POST   /admin/specs             ← Register new spec (URL or payload)
DELETE /admin/specs/:id         ← Remove a spec
POST   /admin/specs/:id/refresh ← Force re-fetch from URL
```

## Spec registry data flow

```
                            ┌─────────────────────┐
                            │  SpecRegistry       │
                            │  Map<id, Entry>     │
                            └─────────────────────┘
                                    ▲
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │ App startup  │  │ POST /admin  │  │ TTL refresh  │
            │ OPENAPI_SPECS│  │ /specs       │  │ (per spec)   │
            │ env var      │  │ (URL fetch)  │  │ setInterval  │
            └──────────────┘  └──────────────┘  └──────────────┘

            Payload upload              URL pull              Auto-refresh
            (no auto-refresh)           (optional TTL)        (optional TTL)
```

## Request flow example

```
# 1. Start app with a spec
$ OPENAPI_SPECS='[{"id":"petstore","label":"Petstore","url":"https://petstore3.swagger.io/api/v3/openapi.json","ttlMs":3600000}]' npm start

# 2. Check health
curl http://localhost:8080/health
→ {"status":"ok","specCount":1}

# 3. View portal
GET http://localhost:8080/
→ HTML table with Petstore spec + links to Redoc / Swagger UI

# 4. View Redoc
GET http://localhost:8080/specs/petstore/redoc
→ HTML page with Redoc viewer (loads spec from /specs/petstore/openapi.json)

# 5. Add another spec dynamically
POST http://localhost:8080/admin/specs
  Authorization: Basic dXNlcjpwYXNz
  {"id":"internal","label":"Internal API","url":"https://my-service/openapi.json"}

# 6. View LLM summary
GET http://localhost:8080/llms.txt
→ Plain text: "# Petstore\n> Version: 1.0.0\n..."
```

## Configuration options

| Env var | Type | Default | Purpose |
|---------|------|---------|---------|
| `OPENAPI_SPECS` | JSON | (none) | Array of specs to pre-load at boot |
| `DEV_MODE` | boolean | false | Skip TenantGuard auth (always pass) |
| `PORT` | number | 8080 (dev) / 80 (prod) | HTTP listen port |
| `GENERATE_API_DOCS` | boolean | false | Generate portal's own spec + exit |
| `C8Y_*` | string | (required) | Cumulocity bootstrap credentials |

Example `OPENAPI_SPECS`:
```json
[
  {
    "id": "petstore",
    "label": "Petstore API",
    "url": "https://petstore3.swagger.io/api/v3/openapi.json",
    "ttlMs": 3600000
  },
  {
    "id": "internal",
    "label": "Internal Service",
    "url": "https://my-service/openapi.json",
    "ttlMs": 1800000
  }
]
```
