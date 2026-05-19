import { Controller, Get, Header, NotFoundException } from "@nestjs/common";
import { OpenApiDocumentService } from "./openapi-document.service";

const LLM_TXT = `\
# Gainsight Sync Microservice API

> A NestJS microservice that periodically pulls Gainsight PX telemetry and user/profile data, caches it in memory per tenant, and exposes REST endpoints consumed by dashboards such as Grafana.

## Purpose

Synchronise Gainsight PX analytics (custom events, session events, page views, active-user metrics) into an in-memory, per-tenant cache and serve aggregated results over HTTP.

## Key endpoint groups

- **Active Users** — \`/activeUsers\`, \`/activeUserMetrics/*\`, \`/v2/activeUsers\` (filter + projection)
- **Custom Events** — \`/events\`, \`/eventCounts\`, \`/widgetsByName\`, \`/v2/events\` (filter + projection), \`/v2/customEvents\` (customer events only, filter + projection)
- **Session Events** — \`/sessionEvents\`, \`/sessionEventsAutoAgg\`, \`/v2/sessionEvents\` (filter + projection)
- **Page Views** — \`/popularDevices\`, \`/pageViewCounts\`, \`/countByType\`, \`/v2/pageViews\` (filter + projection), \`/v2/pageViewCounts\` (filter + group-by aggregation)
- **System** — \`/health\`, \`/lastRun\`

## Common query parameters

All data endpoints require:
- \`start\` — ISO 8601 start of range
- \`end\` — ISO 8601 end of range
- \`tenantId\` — tenant scoping key

V2 endpoints additionally support:
- \`filter\` (optional) — filtrex expression (https://github.com/cshaa/filtrex); strings must be double-quoted
- \`fields\` (optional) — comma-separated list of top-level fields to return

## Authentication

All data endpoints are protected by a \`TenantGuard\` (Basic Auth). Send \`Authorization: Basic <base64(user:password)>\`. \`/health\`, \`/lastRun\`, \`/llms.txt\`, \`/llms-full.txt\`, \`/openapi.json\`, \`/robots.txt\`, and \`/.well-known/ai-plugin.json\` are public.

## Spec & full documentation

- **OpenAPI JSON (live)** — \`/openapi.json\`
- **OpenAPI JSON (repo)** — \`docs/openapi.json\` in the repository
- **Full LLM documentation** — \`/llms-full.txt\`
- **Interactive HTML docs** — https://gainsight.eu-latest.cumulocity.com/apps/gainsight-c8y-openapi/index.html
- **AI plugin manifest** — \`/.well-known/ai-plugin.json\`
`;

const LLM_FULL_TXT = `\
# Gainsight Sync Microservice — Full API Reference

> Complete, flattened documentation for LLM consumption.  
> OpenAPI spec: \`/openapi.json\`

---

## Overview

A small NestJS microservice that periodically pulls Gainsight PX telemetry and user/profile data, keeps that data in memory per tenant, and exposes simple GET endpoints to be consumed e.g. by Grafana.

### What it does

- Fetches custom events, session events, page views and user/profile info every 10 minutes via a cron scheduler.
- On the first run it fetches the last 90 days; subsequent runs are incremental (delta from last run until now).
- Caches all fetched data per tenant using an in-memory IntervalTree for fast range queries.
- Serves REST endpoints returning raw records or aggregated summaries.

### Multi-tenancy & configuration

Tenants are configured via a Cumulocity tenant option (category \`gainsight\`, key \`config\`).  
Example value:

\`\`\`json
[
  {
    "mail": "my-customer-domain.com",
    "domains": [{ "url": "main.customer-cloud.com", "id": "t1234" }]
  }
]
\`\`\`

Adding or removing entries takes effect on the next scheduled run.

---

## Authentication

All data endpoints require Basic Auth, validated by the internal \`TenantGuard\`.  
Send \`Authorization: Basic <base64(user:password)>\`.  
Public endpoints (no auth): \`/health\`, \`/lastRun\`, \`/llms.txt\`, \`/llms-full.txt\`, \`/openapi.json\`, \`/robots.txt\`, \`/.well-known/ai-plugin.json\`.

---

## Common query parameters

| Parameter  | Type   | Required | Description                                      |
|------------|--------|----------|--------------------------------------------------|
| \`start\`    | string | Yes      | ISO 8601 start of the time range                 |
| \`end\`      | string | Yes      | ISO 8601 end of the time range (inclusive)       |
| \`tenantId\` | string | Yes      | Tenant identifier used to scope the cache query  |

---

## Endpoints

### System

#### GET /health
Returns service status.

**Response 200**
\`\`\`json
{ "status": "UP" }
\`\`\`

---

#### GET /lastRun
Returns metadata about the most recent scheduler run.

**Response 200**
\`\`\`json
{
  "lastRun": "<ISO timestamp>",
  "runDuration": "<ms>",
  "runs": 42,
  "isTaskRunning": false
}
\`\`\`

---

### Active Users

#### GET /activeUsers
Returns the list of active users for the tenant in the given time range.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/numberOfUsers
Returns the count of unique active users.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/newSignups
Returns the count of newly signed-up users.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/topLanguages
Returns the most-used UI languages ranked by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/topUserRoles
Returns the most common user roles ranked by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/topCountries
Returns the top countries by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/topPlatforms
Returns the top OS/platforms by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/topBrowsers
Returns the top browsers by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/topDeviceTypes
Returns the top device types (desktop, mobile, tablet) by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /activeUserMetrics/mailDomainNames
Returns the top e-mail domain names by user count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /v2/activeUsers
Returns filtered and projected active users (V2). Filter syntax: filtrex (https://github.com/cshaa/filtrex).

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`filter\` (optional filtrex expression), \`fields\` (optional comma-separated)

**Available fields:** \`id\`, \`roles\`, \`country\`, \`sessionId\`, \`language\`, \`platform\`, \`browser\`, \`device\`, \`domain\`

**Filter examples:**
- \`country == "Germany"\`
- \`platform == "desktop" and browser == "Chrome"\`
- \`device in ("mobile", "tablet")\`

---

### Custom Events

#### GET /events
Returns raw custom events in the time range.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`withId\` (optional boolean — includes \`identifyId\` and \`sessionId\` when true, defaults to false)

---

#### GET /eventCounts
Returns aggregated counts of custom events.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /widgetsByName
Returns event counts grouped by a specific event name.

**Query parameters:** \`eventName\`, \`start\`, \`end\`, \`tenantId\`

---

#### GET /v2/events
Returns filtered and projected custom events (V2). Filter syntax: filtrex (https://github.com/cshaa/filtrex).

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`filter\` (optional filtrex expression), \`fields\` (optional, top-level fields), \`dataFields\` (optional, dot-notation paths inside \`data\`)

**Available top-level fields (\`fields\`):** \`name\`, \`date\`, \`data\`, \`identifyId\`, \`sessionId\`

**Filter examples:**
- \`name == "buttonClick"\`
- \`name in ("click", "hover", "focus")\`
- \`name == "formSubmit" and sessionId == "abc123"\`

**\`dataFields\` examples:** \`widgetName\`, \`attributes.size\`, \`widgetName,attributes.size,user.id\`

---

#### GET /v2/customEvents
Returns only customer-defined events (name prefixed with "customEvent"), filtered and projected. Filter syntax: filtrex (https://github.com/cshaa/filtrex).

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`filter\` (optional filtrex expression), \`fields\` (optional, top-level fields), \`dataFields\` (optional, dot-notation paths inside \`data\`)

**Available top-level fields (\`fields\`):** \`name\`, \`date\`, \`data\`, \`identifyId\`, \`sessionId\`

**\`data\` shape:** \`action_type\`, \`category\`, \`label\`, \`metadata\`

**\`dataFields\` examples:** \`category,label\`, \`action_type,metadata.size\`

---

### Session Events

#### GET /sessionEvents
Returns raw session events in the time range.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /sessionEventsAutoAgg
Returns session events automatically aggregated into time buckets (bucket size chosen based on range length).

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /v2/sessionEvents
Returns filtered and projected session events (V2). Filter syntax: filtrex (https://github.com/cshaa/filtrex).

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`filter\` (optional filtrex expression), \`fields\` (optional comma-separated)

**Available fields:** \`id\`, \`identifyId\`, \`sessionId\`, \`accountId\`, \`date\`, \`propertyKey\`, \`eventType\`, \`remoteHost\`, \`location\`, \`userType\`, \`globalContext\`

**Filter examples:**
- \`userType == "USER"\`
- \`userType in ("USER", "LEAD")\`

---

### Page Views

#### GET /popularDevices
Returns the most visited device IDs (extracted from page-view URL paths), ranked by view count.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

**Response** — array of \`{ path: "#<id>", count: number }\` sorted by count descending.

---

#### GET /countByType
Returns view counts grouped by navigation type.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`type\` (\`"group"\` | \`"device"\` | \`"reports"\` | \`"dashboard"\`)

**Response** — array of \`{ path: "#<id>", count: number }\` sorted by count descending.

---

#### GET /pageViewCounts
Returns time-bucketed page view counts.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`

---

#### GET /v2/pageViews
Returns filtered and projected page-view events (V2).

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`filter\` (optional filtrex expression), \`fields\` (optional comma-separated), \`orderBy\` (optional, e.g. \`date:desc\`)

**Available fields:** \`id\`, \`identifyId\`, \`sessionId\`, \`date\`, \`scheme\`, \`host\`, \`path\`, \`queryString\`, \`hash\`, \`queryParams\`, \`remoteHost\`, \`referrer\`, \`screenHeight\`, \`screenWidth\`, \`languages\`, \`pageTitle\`, \`propertyKey\`, \`eventType\`, \`userType\`, \`accountId\`, \`globalContext\`

**Filter examples:**
- \`hash ~= "group/123/dashboard"\` — all dashboards inside group 123
- \`hash ~= "device/456/dashboard"\` — all dashboards inside device 456
- \`userType == "USER" and host == "app.example.com"\`
- \`pageTitle ~= "Dashboard"\`

---

#### GET /v2/pageViewCounts
Returns page-view counts aggregated by a chosen field (default: \`hash\`). Supports the same filtrex filter as \`/v2/pageViews\` for scoping before aggregation.

**Query parameters:** \`start\`, \`end\`, \`tenantId\`, \`filter\` (optional filtrex expression), \`groupBy\` (optional field name, default \`hash\`), \`pathMask\` (optional \`"true"\` — replaces numeric segments with \`*\`), \`limit\` (optional integer — top-N results)

**Filter + groupBy examples:**
- Most visited dashboards in group 123: \`filter=hash ~= "group/123/dashboard"&groupBy=hash&limit=10\`
- Most active accounts: \`groupBy=accountId&limit=5\`
- Page-type popularity: \`groupBy=hash&pathMask=true\`

**Response** — array of \`{ value: string, count: number }\` sorted by count descending.

---

## Caching internals

- Each tenant has its own **\`ChronoArrayCache<T>\`** — a date-sorted \`T[]\` stored in a \`Map<tenantId, T[]>\`.
- \`setCache(items, tenantId)\` sorts the incoming batch by date ascending, appends it to the tenant array, and evicts items older than \`TTL_DAYS\` from the head.
- \`queryCache(start, end, tenantId)\` uses binary search (lower-bound + upper-bound) for O(log n) range lookups, with O(1) fast paths when \`end\` ≥ newest item or \`start\` ≤ oldest item.
- Caches are **in-memory only**; a restart clears all data and the scheduler repopulates them on the next run.

---

## Scheduling

- Cron job runs every **10 minutes**.
- First run fetches the last **90 days**.
- Subsequent runs are incremental (delta from last successful run).

---

## OpenAPI specification

The machine-readable OpenAPI 3.0 spec is available at:

- Repository: \`docs/openapi.json\`
- Interactive HTML docs: https://gainsight.eu-latest.cumulocity.com/apps/gainsight-c8y-openapi/index.html

To preview locally:

\`\`\`sh
npx @redocly/cli preview-docs docs/openapi.json
\`\`\`
`;

const ROBOTS_TXT = `\
User-agent: *
Allow: /

# AI / LLM entry points
LLM-txt: /llms.txt
LLM-txt-full: /llms-full.txt
`;

const AI_PLUGIN = {
  schema_version: "v1",
  name_for_human: "Gainsight Sync MS",
  name_for_model: "gainsight_sync_ms",
  description_for_human: "Serves cached Gainsight PX analytics (custom events, session events, page views, active users) per tenant.",
  description_for_model:
    "REST API backed by an in-memory per-tenant cache that is refreshed every 10 minutes from Gainsight PX. " + "Endpoints accept start/end ISO 8601 timestamps and a tenantId query parameter. " + "All data endpoints require Basic Auth. See /openapi.json for the full machine-readable spec.",
  auth: { type: "user_http", authorization_type: "basic" },
  api: { type: "openapi", url: "/openapi.json" },
  logo_url: "",
  contact_email: "",
  legal_info_url: "",
};

@Controller()
export class LlmController {
  constructor(private readonly openApiDocument: OpenApiDocumentService) {}

  /**
   * Returns a concise LLM-readable summary of the API in plain text format.
   *
   * @returns Plain text overview of the API endpoints and authentication.
   */
  @Get("llms.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  getLlmsTxt(): string {
    return LLM_TXT;
  }

  /**
   * Returns the full LLM-readable API reference in plain text format.
   *
   * @returns Complete plain text API documentation for LLM consumption.
   */
  @Get("llms-full.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  getLlmsFullTxt(): string {
    return LLM_FULL_TXT;
  }

  /**
   * Returns the current OpenAPI specification document as JSON.
   *
   * @returns OpenAPI specification object.
   * @throws NotFoundException if the document has not yet been generated.
   */
  @Get("openapi.json")
  @Header("Content-Type", "application/json; charset=utf-8")
  getOpenApiSpec(): Record<string, unknown> {
    const doc = this.openApiDocument.getDocument();
    if (!doc) {
      throw new NotFoundException("OpenAPI document is not yet available.");
    }
    return doc;
  }

  /**
   * Returns the robots.txt file providing crawler guidance for search engines.
   *
   * @returns Plain text robots.txt content.
   */
  @Get("robots.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  getRobotsTxt(): string {
    return ROBOTS_TXT;
  }

  /**
   * Returns the AI plugin manifest conforming to the OpenAI plugin specification.
   *
   * @returns AI plugin manifest object.
   */
  @Get(".well-known/ai-plugin.json")
  @Header("Content-Type", "application/json; charset=utf-8")
  getAiPlugin(): typeof AI_PLUGIN {
    return AI_PLUGIN;
  }
}
