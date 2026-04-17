import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { PageViewCacheService } from "../../cache/page-view-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  ControllerPageView,
  ControllerPageViewFieldList,
  ControllerPageViewResponse,
  mapCachedPageViewToControllerPageView,
} from "../../model/controller-model";
import { filterArray, projectData } from "../../util/dynamic-queries";

@UseGuards(TenantGuard)
@Controller()
export class PageViewControllerV2 {
  private readonly logger = new Logger(PageViewControllerV2.name);
  constructor(private pageViewCacheService: PageViewCacheService) {}

  /**
   * Returns page-view events from the cache within the given time range, with
   * optional server-side filtering and field projection.
   *
   * **`filter`** — a [`filtrex`](https://github.com/cshaa/filtrex) expression
   * evaluated against each mapped page-view. Strings must be **double-quoted**.
   *
   * | Goal | Expression |
   * |---|---|
   * | Specific host | `host == "app.example.com"` |
   * | Specific path | `path == "/dashboard"` |
   * | Mobile users only | `userType == "mobile"` |
   * | Compound condition | `host == "app.example.com" and eventType == "pageView"` |
   * | Multiple paths | `path in ("/home", "/settings", "/profile")` |
   *
   * **`fields`** — comma-separated top-level fields to return from the mapped
   * page-view. Valid values match the keys of {@link ControllerPageView}:
   * `id`, `identifyId`, `sessionId`, `date`, `scheme`, `host`, `path`,
   * `queryString`, `hash`, `queryParams`, `remoteHost`, `referrer`,
   * `screenHeight`, `screenWidth`, `languages`, `pageTitle`, `propertyKey`,
   * `eventType`, `userType`, `accountId`, `globalContext`.
   * When omitted, all top-level fields are returned.
   *
   * | Goal | Value |
   * |---|---|
   * | URL parts only | `host,path,queryString` |
   * | Page identity | `id,date,pageTitle` |
   * | User context | `id,identifyId,sessionId,userType` |
   * | Full page view (default) | _(omit param)_ |
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional {@link ControllerPageViewFieldList}: comma-separated top-level page-view fields to include.
   * @returns Filtered, mapped, and projected page-view objects; empty array on error.
   */
  @Get("v2/pageViews")
  getPageViewsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerPageViewFieldList,
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
      const fieldList: (keyof ControllerPageView)[] = fields
        ? fields.split(",").map((f) => f.trim() as keyof ControllerPageView)
        : [];
      return filtered.map((pv) => {
        const projected = projectData(pv, fieldList);
        return { id: pv.id, ...projected };
      });
    } catch (e) {
      this.logger.error("Error during page view retrieval", e);
      return [];
    }
  }
}
