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

### Events
Events are like a click of a button, adding of a widget, etc.

Custom Events
- GET /customEvents (if present)
  - Description: raw custom events for configured projects (may be filtered to project/devicemanagement).
  - Query params: start, end, tenantId
  - Response: array of raw event objects (date, attributes, sessionId, globalContext, ...)

Event Counts
- GET /eventCounts
  - Description: counts of custom events grouped by event name for a project (e.g. devicemanagement).
  - Query params: start, end, tenantId
  - Response: [{ value: string (eventName), count: number }, ...]

Event Counts By Name (widgets)
- GET /widgetsByName
  - Description: counts grouped by widget (or widgetName attribute) for a single event name.
  - Query params: eventName (required), start, end, tenantId
  - Response: [{ name: string (widgetName), count: number }, ...]

### Sessions
Sessions describe how often users are active over a time period. If no more activity is detected, the session counts as terminated. Unique users can have multiple sessions per day.

Session Events
- GET /sessionEvents
  - Description: returns raw session event records (per-tenant) in the requested date range.
  - Query params: start, end, tenantId
  - Response: array of session events (time/date, eventId, identifyId, inferredLocation, userType, ...)

Session Events Auto Aggregation
- GET /sessionEventsAutoAgg
  - Description: aggregates session events into buckets depending on requested range:
    - If range ≤ 1 hour → MINUTE buckets
    - If range ≤ 1 day → HOUR buckets
    - Otherwise → DAY buckets
  - Query params: start (required), end, tenantId
  - Response: [{ time: ISO timestamp for bucket start, count: number }, ...] sorted ascending by time

### Page views
Where did users route to. Can be used to derive general paths (as done via /pageViews) or to determine popular devices (extracted from the urls and count aggregated).

Page Views
- GET /pageViews (if present)
  - Description: returns raw page view events for configured domains.
  - Query params: start (required for some handlers), end, tenantId
  - Response: array of page view objects (scheme, host, path, hash, query, ...)

Popular Devices
- GET /popularDevices
  - Description: aggregates device identifiers or hashes extracted from page view data (e.g. in path/hash) and returns counts.
  - Query params: start (required), end, tenantId
  - Response: [{ path: string, count: number }, ...] sorted by count desc

Page View Counts
- GET /pageViewCounts
  - Description: groups page views by masked/mapped URL (e.g. numbers replaced with `*`) and returns counts.
  - Query params: start (required), end, tenantId
  - Response: [{ path: string, count: number }, ...]

### Active User Metrics
All endpoints below typically use the page view / user profile caches and accept start/end/tenantId query params. Each returns an array of values or a { count } object depending on the metric.

- GET /activeUserMetrics/numberOfUsers
  - Returns the number of active users in the date range.

- GET /activeUserMetrics/newSignups
  - Returns the number of new signups since the requested start date.

- GET /activeUserMetrics/topLanguages
  - Returns language counts/percentages.

- GET /activeUserMetrics/topUserRoles
  - Returns role counts/percentages (roles are parsed from a comma-separated custom attribute).

- GET /activeUserMetrics/topCountries
  - Returns country counts/percentages.

- GET /activeUserMetrics/topPlatforms
  - Returns platform counts/percentages (based on lastVisitedUserAgentData).

- GET /activeUserMetrics/topBrowsers
  - Returns browser counts/percentages.

- GET /activeUserMetrics/topDeviceTypes
  - Returns device type counts/percentages.

- GET /activeUserMetrics/mailDomainNames
  - Returns email domain counts/percentages.

Response shapes for metrics
- Count responses: { count: number }
- Top lists: [{ value: string, count: number, percentage: number }, ...] — percentage rounded to two decimals.

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