import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { PageViewCacheService } from "../../cache/page-view-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import { CachedPageView } from "../../model/cache-model";
@UseGuards(TenantGuard)
@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);
  constructor(private pageViewCacheService: PageViewCacheService) {}

  /**
   * Returns page-view counts aggregated by device ID within the given time
   * range, sorted by count in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of path/count pairs sorted by count descending; empty array on error.
   */
  @Get("/popularDevices")
  async getDeviceCounts(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `getDeviceCounts from ${start} to ${end} tenant ${tenantId} type device`,
    );
    try {
      const pageViews = this.pageViewCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      return this.aggregateById(pageViews, "device");
    } catch (e) {
      this.logger.error("Error during device count aggregation", e);
      return [];
    }
  }

  /**
   * Returns page-view counts aggregated by a specific path segment type
   * within the given time range. Counts page-view URLs that match the pattern
   * "/{type}/{numericId}" and groups them by numeric ID.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param type - The URL path segment type to aggregate by: "group", "device", "reports", or "dashboard".
   * @returns Array of path/count pairs sorted by count descending; empty array on error.
   */
  @Get("/countByType")
  async getCountsForType(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("type") type: "group" | "device" | "reports" | "dashboard",
  ) {
    this.logger.verbose(
      `getCountsForType from ${start} to ${end} tenant ${tenantId} type ${type}`,
    );
    try {
      const pageViews = this.pageViewCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      return this.aggregateById(pageViews, type);
    } catch (e) {
      this.logger.error("Error during count aggregation for type " + type, e);
      return [];
    }
  }

  private aggregateById(
    views: CachedPageView[],
    type: "group" | "device" | "reports" | "dashboard",
  ) {
    const pattern = new RegExp(`(?:^|\/)${type}\/(\\d+)`);
    const counts: Record<string, number> = {};
    for (const view of views) {
      const path = view.hash;
      const match = path.match(pattern);
      if (match) {
        const numberId = "#" + match[1];
        if (!counts[numberId]) {
          counts[numberId] = 0;
        }
        counts[numberId]++;
      }
    }

    const mapped = Object.entries(counts).map(([path, count]) => ({
      path,
      count,
    }));
    return mapped.sort((a, b) => b.count - a.count);
  }

  /**
   * Returns page-view counts aggregated by masked URL pattern within the given
   * time range. Numeric segments in the URL path are replaced with wildcards
   * before grouping, producing a count per page type.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of path/count pairs sorted by count descending; empty array on error.
   */
  @Get("/pageViewCounts")
  async getPageViewCounts(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `getPageViewCounts from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const pageViews = this.pageViewCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      return this.createrPopularPagesAggregation(pageViews);
    } catch (e) {
      this.logger.error("Error during page view count aggregation", e);
      return [];
    }
  }

  private createrPopularPagesAggregation(views: CachedPageView[]) {
    const counts: Record<string, number> = {};
    for (const view of views) {
      const path = view.hash;
      const maskeUrl = path.replace(/\d+/g, "*");
      if (!maskeUrl) {
        continue;
      }
      if (!counts[maskeUrl]) {
        counts[maskeUrl] = 0;
      }
      counts[maskeUrl]++;
    }

    const mapped = Object.entries(counts).map(([path, count]) => ({
      path,
      count,
    }));
    return mapped.sort((a, b) => b.count - a.count);
  }
}
