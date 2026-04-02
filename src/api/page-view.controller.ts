import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { PageViewCacheService } from "../cache/page-view-cache.service";
import { PageView } from "../model/gainsight-px.model";
import { TenantGuard } from "../guards/tenant.guard";
@UseGuards(TenantGuard)
@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);
  constructor(private pageViewCacheService: PageViewCacheService) {}

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

  @Get("/countByType")
  async getCountsForType(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("type") type: "group" | "device" | "reports",
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
    views: PageView[],
    type: "group" | "device" | "reports",
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

  private createrPopularPagesAggregation(views: PageView[]) {
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
