# OpenAPI Doc Hosting — Plan & Open Questions

## Goal

Strip out all Gainsight/Cumulocity-specific business logic and turn this repo into a **generic, lightweight NestJS app whose only job is to host an OpenAPI spec and render interactive API docs**.

---

## What currently exists (relevant parts to keep)

| File / module | Role | Keep? |
|---|---|---|
| `docs/openapi.json` | Static OpenAPI v3.0.1 spec | ✅ (or replace with a user-supplied spec) |
| `docs/index.html` | Pre-built Redoc HTML | ✅ |
| `src/api/ai/openapi-document.service.ts` | Lazily generates & caches the live OpenAPI doc via `@nestjs/swagger` | ⚠️ simplify or remove |
| `src/api/ai/llm.controller.ts` | Serves `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/.well-known/ai-plugin.json`, `/robots.txt` | ⚠️ keep structure, replace content |
| `src/main.ts` → `GENERATE_API_DOCS` branch | Writes spec to disk, then exits | ⚠️ simplify / remove |
| `@redocly/cli` devDependency | Builds `docs/index.html` from the spec | ✅ |
| `Dockerfile` | Container packaging | ✅ adapt |

## What to remove

- All of `src/api/v1/`, `src/api/v2/` (business controllers)
- All of `src/cache/` (in-memory Gainsight caches)
- All of `src/service/` except anything needed purely for doc serving
- All of `src/guards/` (TenantGuard — auth for data endpoints)
- All of `src/model/` (Gainsight domain models)
- `src/util/`, `@nestjs/schedule`, `@c8y/client`, `filtrex`, `lodash`, `date-fns`, `axios`, `zod` dependencies
- `src/bootstrap.module.ts` (Cumulocity bootstrap logic)

## Proposed new structure

```
src/
  main.ts                    — NestJS bootstrap, serve static HTML at /
  app.module.ts              — minimal module (just DocModule)
  doc/
    doc.controller.ts        — GET /openapi.json  → serve spec (static file or env-configured path)
                             — GET /              → serve Redoc HTML
                             — GET /llms.txt      → LLM-friendly plain-text summary (optional)
    doc.module.ts
docs/
  openapi.json               — the spec to serve (can be mounted as a volume)
  index.html                 — pre-built Redoc HTML (regenerated via `pnpm docs:build`)
```

## Decisions (answered)

| # | Question | Answer |
|---|---|---|
| 1 | Spec source | Runtime-configurable (env var / config, not committed files) |
| 2 | Multiple specs | Yes — multiple specs, selectable via UI |
| 3 | Live generation | Yes — specs served dynamically at runtime, not pre-built static files |
| 4 | UI renderer | Both Redoc **and** Swagger UI (user can switch) |
| 5 | LLM endpoints | _See open question below_ |
| 6 | Auth | Configurable (can be enabled/disabled per deployment) |
| 7 | Deployment | Cumulocity microservice (keep `cumulocity.json`, service routing) |
| 8 | Repo rename | Yes — rename as part of this work (see name proposal below) |

---

## Proposed repo name

Candidates (keeping the Cumulocity `-ms` convention):

| Name | Notes |
|---|---|
| **`openapi-portal-ms`** | Emphasises the portal/UI aspect |
| `api-docs-ms` | Simple and descriptive |
| `openapi-host-ms` | Matches the "host" framing in the goal |

**Recommendation: `openapi-portal-ms`** — it implies a multi-spec, UI-rich portal rather than just a single-file host.

---

## Final decisions (all answered)

| # | Question | Answer |
|---|---|---|
| A | Spec source / live serving | **Hybrid A2 + A3**: pull from remote URLs (with TTL cache) _and_ push via `POST /admin/specs` |
| B | LLM endpoints | Keep `GET /llms.txt` only (auto-derived from spec metadata); drop `/llms-full.txt` and `/.well-known/ai-plugin.json` |
| C | Auth | **Cumulocity `TenantGuard`** — reuse the existing pattern |
| 8 | Repo name | **`openapi-portal-ms`** |

---

## Full implementation plan

### Phase 1 — Scaffold & rebrand
- [ ] Rename package (`package.json` `name` → `openapi-portal-ms`), update `cumulocity.json`, `Dockerfile` labels, `README.md`
- [ ] Delete all files under `src/api/v1/`, `src/api/v2/`, `src/cache/`, `src/service/` (except `c8y-bootstrap.service.ts` and `c8y-client-provider.service.ts` which are needed for `TenantGuard`), `src/util/`, `src/model/` (domain models only — keep nothing Gainsight-specific)
- [ ] Remove unused dependencies: `@c8y/client` stays; remove `filtrex`, `date-fns`, `axios`, `zod`, `lodash`, `@nestjs/schedule`

### Phase 2 — Spec registry (`SpecRegistryService`)
Central service that owns all known specs in memory.

```
src/spec/
  spec-registry.service.ts   — in-memory Map<id, SpecEntry>
  spec-registry.module.ts
  spec.model.ts              — SpecEntry { id, label, url?, content, fetchedAt, ttlMs }
```

- `addFromUrl(id, label, url, ttlMs)` — fetches spec JSON from the URL, stores it, schedules background refresh
- `addFromPayload(id, label, content)` — stores an uploaded spec directly (no URL)
- `getAll()` — returns list of `{ id, label }` for the UI nav
- `getById(id)` — returns the full spec JSON
- `deleteById(id)`
- Background refresh: a simple `setInterval` per URL-backed spec; re-fetches when TTL expires

### Phase 3 — Admin API (`AdminController`) — protected by `TenantGuard`

```
POST   /admin/specs          — body: { id, label, url?, content? }  → register a new spec
DELETE /admin/specs/:id      — remove a spec
GET    /admin/specs          — list all registered specs with metadata (id, label, url, fetchedAt)
POST   /admin/specs/:id/refresh — force re-fetch for a URL-backed spec
```

### Phase 4 — Public doc endpoints (`DocController`) — public

```
GET  /specs                  — JSON list of { id, label } (powers the UI nav)
GET  /specs/:id/openapi.json — raw spec JSON for the given id
GET  /specs/:id/redoc        — Redoc HTML for the given id
GET  /specs/:id/swagger      — Swagger UI HTML for the given id
GET  /llms.txt               — plain-text summary: one entry per spec (id + info.title + info.description)
GET  /health                 — { status: 'ok', specCount: N }
```

### Phase 5 — Portal UI (minimal, no framework)
- A single `index.html` served at `GET /` listing all registered specs with links to their Redoc and Swagger UI pages
- Redoc: load `redoc-standalone` from CDN; pass the spec URL as a query param (`specUrl=/specs/:id/openapi.json`)
- Swagger UI: load `swagger-ui` from CDN; same pattern

### Phase 6 — Configuration bootstrap
On startup the app reads an optional env var `OPENAPI_SPECS` containing a JSON array:
```json
[
  { "id": "petstore", "label": "Petstore API", "url": "https://petstore3.swagger.io/api/v3/openapi.json", "ttlMs": 3600000 },
  { "id": "internal", "label": "Internal API",  "url": "https://my-service/openapi.json", "ttlMs": 1800000 }
]
```
This pre-populates the registry at boot without needing a manual `POST /admin/specs`.

### Phase 7 — Cleanup & tests
- Remove all Gainsight-related spec and model files from `src/`
- Update/replace existing unit tests for the new services and controllers
- Update `docs/openapi.json` to reflect the new app's own API (the admin + doc endpoints)
- Regenerate `docs/index.html` with Redocly CLI

---

## Module dependency graph (new)

```
AppModule
 ├── BootstrapModule          (Cumulocity bootstrap — unchanged)
 ├── SpecRegistryModule       (new — owns the spec Map + URL refresh)
 ├── AdminModule              (new — CRUD for specs, guarded by TenantGuard)
 └── DocModule                (new — public read endpoints + portal HTML)
```

## Files to delete (exhaustive list)

```
src/api/v1/
src/api/v2/
src/cache/
src/service/gainsight-px.service.ts
src/service/scheduler.service.ts
src/service/scheduler.service.spec.ts
src/service/dev-mode.service.ts
src/service/cache-backup.service.ts
src/service/settings.service.ts
src/service/user-utility.service.ts
src/service/user-utility.sevice.spec.ts
src/model/cache-model.ts
src/model/cache-model.spec.ts
src/model/cache-update-status.model.ts
src/model/controller-model.ts
src/model/customer-custom-event.model.ts
src/model/gainsight-px.model.ts
src/model/hierarchy-tree.json
src/util/
src/app.controller.ts        (replace with minimal health controller)
src/app.model.ts
src/api/ai/llm.controller.ts (replace with new DocController)
src/api/ai/openapi-document.service.ts (replace with SpecRegistryService)
```