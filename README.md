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

# REST endpoints
The following REST API endpoints are exposed by the microservice, detailling the query parameters each endpoint accepts.

Table of contents
- Overview
- Common query parameters
- Endpoints
  - Custom Events
  - Event Counts
  - Event Counts By Name (widgets)
  - Session Events
  - Session Events Auto Aggregation
  - Page Views
  - Popular Devices
  - Page View Counts
  - Active User Metrics
- Scheduling & Caching
  - What is fetched
  - How data is cached (TreeCache / IntervalTree)
  - Cache behavior and guarantees
- Notes & operational recommendations


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
- The app uses per-tenant in-memory caches implemented by TreeCache<T> subclasses (e.g. SessionEventsCacheService, PageViewCacheService, CustomEventsCacheService).
- Each tenant gets:
  - An IntervalTree (interval-tree) populated with GenericInterval<T> nodes where low === high === timestamp for point-in-time events.
  - A bounds map storing the newest/oldest items seen for that tenant.
- setCache(items, tenantId)
  - Validates the incoming items array.
  - Warns and returns if empty.
  - Verifies items are sorted by date (ascending). If not sorted, it sorts them by the date key returned from getDate(item).
  - Calls setBounds(...) to update oldest/newest entries for the tenant.
  - Inserts each item into the tenant's IntervalTree using the item timestamp as an interval point.
- queryCache(start, end, tenantId)
  - Accepts start/end ISO strings and returns the array of cached items for that tenant whose timestamps fall inside the requested interval (inclusive). IntervalTree enables efficient range queries.

## Cache behavior and guarantees
- Per-tenant caches are in memory only (no persistence). A restart clears caches and scheduled fetchers must repopulate them.
- setCache will sort input data and log warnings if input wasn't already sorted.
- queryCache is synchronous/fast because it reads from in-memory structures. Controllers must call and await any promise-based cache implementations consistently.
- The cache stores point-in-time events as intervals where low === high. Range queries use numeric timestamps derived via each cache's getDate(item) implementation.

## Operational notes & recommendations
- Ensure scheduled fetches are non-blocking (no sync fs/exec or CPU-heavy synchronous work) — they run on the Node event loop and can block controller request handling if they block CPU.
- Add timeouts around remote HTTP calls made by the scheduler to avoid stuck fetches.
- Monitor memory usage: caches keep all fetched items in memory per tenant; if telemetry volume is large, consider retention windows or backing the cache with a persistent store.
- Rehydrate cache on startup or expose a health endpoint to allow external tooling to verify caches are populated.
- The service assumes input dates are ISO parsable. Make sure upstream data provides valid timestamps.

## OpenAPI / API docs

- **Spec file shipped:** `docs/openapi.json` (OpenAPI v3.0.1) — a static spec covering the controllers in `src/api`.
- **Generate / preview docs using Redocly CLI:** this repository includes `@redocly/cli` as a devDependency. After running `npm install` you can:
  - Preview the docs locally: `npx @redocly/cli preview-docs docs/openapi.json`
  - Bundle into a single-file HTML (example): `npx @redocly/cli build-docs docs/openapi.json -o docs/index.html`
  - Inspect available commands: `npx @redocly/cli --help`

If you prefer to generate the OpenAPI spec from the running app (automatic DTO/schema extraction), you can integrate `@nestjs/swagger` and emit a runtime spec instead of (or in addition to) the static `docs/openapi.json`.
