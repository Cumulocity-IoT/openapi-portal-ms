# Gainsight Sync Microservice — API & Scheduling Documentation

## Overview

A small NestJS microservice that periodically pulls Gainsight PX telemetry and user/profile data, keeps that data in memory per tenant, and exposes simple GET endpoints to be consumed e.g. by Grafana.

### What it does (high level)

Fetches custom events, session events, page views and user/profile info every 10 minutes in a scheduled manner.
On the first run it will fetch for the last 90 days, in subsequent runs it will only query from the last run until now (delta).
Caches the fetched data per tenant for fast range queries.
Serves REST endpoints that return raw records or aggregated summaries (counts, top languages/platforms/countries, time‑bucketed session counts, popular pages/devices).

### Configuration via Tenant Option

Adding or removing customers is easy:
1. Create a new technical user, that has only access to this MS
2. Update the tenant option with category gainsight and key config by adding a new entry like this: `{\"mail\":\"my-customer-domain.com\",\"domains\":[{\"url\":\"main.customer-cloud.com\",\"id\":\"t1234\"}`

On the next scheduled run, the MS will also crawl telemtry data for the newly configured tenant(s).


## Overview
This microservice periodically pulls Gainsight (PX) telemetry (custom events, session events, page views, user/profile metrics) and serves aggregated and filtered results through REST endpoints. Data is cached in memory per tenant to allow fast range queries.

Common query parameters
- start (string, required) — ISO date/time string or other date-parsable value; many endpoints support filtering by start date.
- end (string, required) — ISO date/time string to specify an end (inclusive).
- tenantId (string, required) — multi-tenant identifier; caches are maintained per tenant.

All GET endpoints return JSON. On internal errors the endpoints return an empty array or object (depending on the handler) and log the error.

## Endpoints

The full, up-to-date API specification and generated docs are available from the bundled OpenAPI outputs in the `docs/` folder. Instead of duplicating the endpoint list here, open the generated files:

- HTML (single-file): `docs/openapi.html` (generated with `@redocly/cli` — preview or bundle using the CLI)
- Markdown: `docs/openapi.md` (if present — produced from the OpenAPI spec)

You can generate or preview these locally; see the "OpenAPI / API docs" section below for `@redocly/cli` commands.

# Technical details

## What is fetched
- A scheduler module periodically runs jobs to fetch telemetry and user data from configured upstream sources (Gainsight / PX APIs or other configured endpoints):
  - Custom events
  - Session events
  - Page views
  - User/profile data used for active-user metrics

- Frequency:
  - Scheduler uses cron-like annotations and runs at configured intervals (see scheduler.service.ts). Typical configuration fetches updates every few minutes for telemetry and less frequently for user aggregates.

## How data is cached
- The app uses per-tenant in-memory caches implemented by `ChronoArrayCache<T>` subclasses (e.g. `SessionEventsCacheService`, `PageViewCacheService`, `CustomEventsCacheService`).
- Each tenant gets a date-sorted `T[]` array stored in a `Map<tenantId, T[]>`.
- `setCache(items, tenantId)`
  - Sorts the incoming batch by date ascending before appending.
  - Appends to the tenant's array.
  - Applies TTL eviction: items older than `TTL_DAYS` are dropped from the head.
- `queryCache(start, end, tenantId)`
  - Applies binary search (lower-bound for `start`, upper-bound for `end`) to find the slice in O(log n).
  - Two O(1) fast paths: if `end` ≥ newest item, skip the upper-bound search; if `start` ≤ oldest item, skip the lower-bound search.
  - Returns the matching slice.

## Cache behavior and guarantees
- Per-tenant caches are in memory only (no persistence). A restart clears caches and scheduled fetchers must repopulate them.
- `setCache` sorts incoming batches before appending and evicts records older than `TTL_DAYS` from the head of the array.
- `queryCache` is synchronous and fast: binary search on a pre-sorted array gives O(log n) range lookups with O(1) fast paths for the common Grafana "up to now" and "all time" queries.
- Each cache subclass implements `getDate(item)` to extract the numeric timestamp used for sorting and searching.

## Operational notes & recommendations
- Ensure scheduled fetches are non-blocking (no sync fs/exec or CPU-heavy synchronous work) — they run on the Node event loop and can block controller request handling if they block CPU.
- Add timeouts around remote HTTP calls made by the scheduler to avoid stuck fetches.
- Monitor memory usage: caches keep all fetched items in memory per tenant; if telemetry volume is large, consider retention windows or backing the cache with a persistent store.
- Rehydrate cache on startup or expose a health endpoint to allow external tooling to verify caches are populated.
- The service assumes input dates are ISO parsable. Make sure upstream data provides valid timestamps.

## OpenAPI / API docs

- **Spec file shipped:** `docs/openapi.json` (OpenAPI v3.0.1) — a static spec covering the controllers in `src/api`.
- **Generate / preview docs using Redocly CLI:** this repository includes `@redocly/cli` as a devDependency. After running `pnpm install` you can:
  - Preview the docs locally: `npx @redocly/cli preview-docs docs/openapi.json`
  - Bundle into a single-file HTML (example): `npx @redocly/cli build-docs docs/openapi.json -o docs/index.html`
  - Inspect available commands: `npx @redocly/cli --help`

The app already uses `@nestjs/swagger` to generate the OpenAPI spec at runtime. Run `pnpm run openapi:generate` to start the app in dev mode and write the live spec to `docs/openapi.json`.

---

## Contributing

- Add new files to `.gitignore` as needed for local env files (`.env.local`), IDE settings, and platform-specific files (`.DS_Store`).
- Run:
  - `pnpm install`
  - `pnpm run lint`
  - `pnpm test`
  - `pnpm run build`
- Use the same naming and route patterns as existing modules under `src/api`, `src/cache`, and `src/service`.
- Do not commit secrets in `.env` or code.

