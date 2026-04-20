import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { PageViewCacheService } from "../../cache/page-view-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  ControllerPageView,
  ControllerPageViewFieldList,
  ControllerPageViewResponse,
  mapCachedPageViewToControllerPageView,
} from "../../model/controller-model";
import {
  filterArray,
  parseFieldList,
  parseOrderBy,
  projectData,
  sortArray,
} from "../../util/dynamic-queries";

type PageViewCountResult = { value: string; count: number };

@UseGuards(TenantGuard)
@Controller()
export class PageViewControllerV2 {
  private readonly logger = new Logger(PageViewControllerV2.name);
  constructor(private pageViewCacheService: PageViewCacheService) {}

  /**
   * Returns page-view events from the cache within the given time range, with optional filtering and field projection.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional comma-separated page-view fields to include.
   * @returns Filtered, mapped, and projected page-view objects; empty array on error.
   */
  @ApiOperation({
    summary:
      "Returns page-view events from the cache within the given time range.",
    description:
      "Supports optional server-side filtering via filtrex (https://github.com/cshaa/filtrex), " +
      "field projection, and sorting. All string values in filter expressions must be double-quoted. " +
      "Use the `~=` operator for regex matching, e.g. to scope results to a specific group or device.\n\n" +
      "**Filter examples**\n" +
      '- All dashboards of group 123: `hash ~= "group/123/dashboard"`\n' +
      '- All dashboards of device 456: `hash ~= "device/456/dashboard"`\n' +
      '- Any dashboard across all groups or devices: `hash ~= "(group|device)/[0-9]+/dashboard"`\n' +
      '- Specific user type: `userType == "USER"`\n' +
      '- Multiple paths: `path in ("/home", "/settings")`',
  })
  @ApiQuery({
    name: "filter",
    required: false,
    description:
      "filtrex filter expression. Strings must be double-quoted. " +
      "Use ~= for regex matching. Examples:\n" +
      '- `hash ~= "group/123/dashboard"` — all dashboard views inside group 123\n' +
      '- `hash ~= "device/456/dashboard"` — all dashboard views inside device 456\n' +
      '- `userType == "USER" and host == "app.example.com"`',
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description:
      "Comma-separated page-view fields to return. Valid values: id, identifyId, sessionId, date, scheme, host, path, queryString, hash, queryParams, remoteHost, referrer, screenHeight, screenWidth, languages, pageTitle, propertyKey, eventType, userType, accountId, globalContext. Omit to return all fields.",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    description:
      "Field and optional direction to sort results by, in the format `field` or `field:asc` / `field:dir`. " +
      "Direction defaults to `asc` when omitted. Valid field values match those listed in `fields`.\n\n" +
      "**Examples**\n" +
      "- `date:desc` — most recent events first\n" +
      "- `date:asc` — oldest events first\n" +
      "- `identifyId:asc` — alphabetical by user\n" +
      "- `pageTitle:asc` — alphabetical by page title",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered, sorted, and projected page-view objects.",
    schema: {
      example: [
        {
          id: "pv-001",
          identifyId: "user-001",
          sessionId: "sess-abc123",
          date: "2024-01-15T10:30:00.000Z",
          scheme: "https",
          host: "app.example.com",
          hash: "#/group/123/dashboard/7",
          pageTitle: "Dashboard Overview",
          eventType: "pageView",
          userType: "USER",
          accountId: "acc-001",
        },
        {
          id: "pv-002",
          identifyId: "user-002",
          sessionId: "sess-def456",
          date: "2024-01-14T09:00:00.000Z",
          scheme: "https",
          host: "app.example.com",
          hash: "#/device/456/dashboard/3",
          pageTitle: "Device Dashboard",
          eventType: "pageView",
          userType: "USER",
          accountId: "acc-001",
        },
      ],
    },
  })
  @Get("v2/pageViews")
  getPageViewsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerPageViewFieldList,
    @Query("orderBy") orderBy?: string,
  ): ControllerPageViewResponse[] {
    this.logger.verbose(
      `getPageViewsV2 from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const pageViews = this.pageViewCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      const mappedPageViews = pageViews.map(
        mapCachedPageViewToControllerPageView,
      );
      const filtered = filterArray(mappedPageViews, filter);
      const orderConfig = parseOrderBy(orderBy);
      const sorted = orderConfig
        ? sortArray(filtered, orderConfig.field as keyof ControllerPageView, orderConfig.direction)
        : filtered;
      const fieldList = parseFieldList(fields);
      return sorted.map((pv) => {
        const projected = projectData(pv, fieldList as (keyof ControllerPageView)[]);
        return { id: pv.id, ...projected };
      });
    } catch (e) {
      this.logger.error("Error during page view retrieval", e);
      return [];
    }
  }

  /**
   * Returns aggregated page-view counts grouped by a chosen field within the given time range.
   * Supports the same filtrex filter as /v2/pageViews for scoping before aggregation.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied before aggregation.
   * @param groupBy - Page-view field to aggregate by (default: "hash").
   * @param pathMask - When "true", replaces numeric segments in the value with "*" before grouping.
   * @param limit - Maximum number of results to return (top-N by count).
   * @returns Array of {value, count} pairs sorted by count descending.
   */
  @ApiOperation({
    summary: "Returns page-view counts aggregated by a chosen field.",
    description:
      "Filters page-views using a filtrex expression (same syntax as `/v2/pageViews`), " +
      "then groups the matching records by the `groupBy` field and counts occurrences. " +
      "Results are always returned sorted by `count` descending so the most-visited item is first.\n\n" +
      "**Typical use cases**\n" +
      '- Most popular dashboards within a group: `filter=hash ~= "group/123/dashboard"&groupBy=hash&limit=10`\n' +
      '- Most popular dashboards within a device: `filter=hash ~= "device/456/dashboard"&groupBy=hash&limit=10`\n' +
      "- Page-type popularity (collapse specific IDs into patterns): `groupBy=hash&pathMask=true`\n" +
      "- Most active accounts: `groupBy=accountId&limit=5`",
  })
  @ApiQuery({
    name: "filter",
    required: false,
    description:
      "filtrex filter expression to scope records before aggregation. Strings must be double-quoted. " +
      "Examples:\n" +
      '- `hash ~= "group/123/dashboard"` — dashboards inside group 123\n' +
      '- `hash ~= "device/456/dashboard"` — dashboards inside device 456\n' +
      '- `userType == "USER"`',
  })
  @ApiQuery({
    name: "groupBy",
    required: false,
    description:
      "Page-view field to aggregate by. Defaults to `hash`. " +
      "Valid values: id, identifyId, sessionId, date, scheme, host, path, queryString, hash, " +
      "remoteHost, referrer, pageTitle, propertyKey, eventType, userType, accountId.",
  })
  @ApiQuery({
    name: "pathMask",
    required: false,
    enum: ["true", "false"],
    description:
      'When set to `"true"`, all numeric segments in the grouped value are replaced with `*` before counting. ' +
      "This collapses individual IDs into page-type patterns. " +
      "Example: `#/group/123/dashboard/7` → `#/group/*/dashboard/*`.",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description:
      "Maximum number of results to return. Applies after sorting, so you always get the top-N by count. " +
      "Omit to return all groups.",
  })
  @ApiResponse({
    status: 200,
    description: "Aggregated page-view counts sorted by count descending.",
    schema: {
      example: [
        { value: "#/group/123/dashboard/7", count: 142 },
        { value: "#/group/123/dashboard/3", count: 89 },
        { value: "#/group/123/dashboard/11", count: 34 },
      ],
    },
  })
  @Get("v2/pageViewCounts")
  getPageViewCountsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("groupBy") groupBy?: ControllerPageViewFieldList,
    @Query("pathMask") pathMask?: string,
    @Query("limit") limit?: string,
  ): PageViewCountResult[] {
    this.logger.verbose(
      `getPageViewCountsV2 from ${start} to ${end} tenant ${tenantId} groupBy ${groupBy ?? "hash"}`,
    );
    try {
      const pageViews = this.pageViewCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      const mappedPageViews = pageViews.map(
        mapCachedPageViewToControllerPageView,
      );
      const filtered = filterArray(mappedPageViews, filter);

      const field = (groupBy ?? "hash") as keyof ControllerPageView;
      const applyMask = pathMask === "true";
      const limitN = limit ? parseInt(limit, 10) : undefined;

      const counts = new Map<string, number>();
      for (const pv of filtered) {
        const raw = pv[field];
        let value = raw === undefined || raw === null ? "" : String(raw);
        if (applyMask) {
          value = value.replace(/\d+/g, "*");
        }
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }

      const result: PageViewCountResult[] = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

      return limitN && limitN > 0 ? result.slice(0, limitN) : result;
    } catch (e) {
      this.logger.error("Error during page view count aggregation", e);
      return [];
    }
  }
}
