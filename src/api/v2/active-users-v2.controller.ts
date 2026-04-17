import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { ActiveUsersCacheService } from "../../cache/active-users-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  ControllerUser,
  ControllerUserFieldList,
  ControllerUserResponse,
  mapCachedUserToControllerUser,
} from "../../model/controller-model";
import { filterArray, projectData } from "../../util/dynamic-queries";

@UseGuards(TenantGuard)
@Controller()
export class ActiveUserControllerV2 {
  private readonly logger = new Logger(ActiveUserControllerV2.name);
  constructor(private cache: ActiveUsersCacheService) {}

  /**
   * Returns active users from the cache within the given time range, with
   * optional server-side filtering and field projection.
   *
   * **`filter`** — a [`filtrex`](https://github.com/cshaa/filtrex) expression
   * evaluated against each mapped user. Strings must be **double-quoted**.
   *
   * | Goal | Expression |
   * |---|---|
   * | Single country | `country == "Germany"` |
   * | Exclude guests | `roles != "guest"` |
   * | Platform filter | `platform == "desktop"` |
   * | Compound condition | `country == "USA" and browser == "Chrome"` |
   * | Multiple devices | `device in ("mobile", "tablet")` |
   *
   * **`fields`** — comma-separated top-level fields to return from the mapped
   * user. Valid values: `id`, `roles`, `country`, `sessionId`, `language`,
   * `platform`, `browser`, `device`, `domain`.
   * When omitted, all top-level fields are returned.
   *
   * | Goal | Value |
   * |---|---|
   * | Identity only | `id,sessionId` |
   * | Location and browser | `id,country,browser,platform` |
   * | Full user (default) | _(omit param)_ |
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional {@link ControllerUserFieldList}: comma-separated top-level user fields to include.
   * @returns Filtered, mapped, and projected user objects; empty array on error.
   */
  @Get("v2/activeUsers")
  getUsersV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerUserFieldList,
  ): ControllerUserResponse[] {
    this.logger.verbose(
      `getUsers from ${start} to ${end} for tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      const mappedUsers = users.map(mapCachedUserToControllerUser);
      const filtered = filterArray(mappedUsers, filter);
      const fieldList: (keyof ControllerUser)[] = fields
        ? fields.split(",").map((f) => f.trim() as keyof ControllerUser)
        : [];
      return filtered.map((user) => {
        const projectedData = projectData(user, fieldList);
        return { id: user.id, ...projectedData };
      });
    } catch (e) {
      this.logger.error("Error during getUsers", e);
      return [];
    }
  }
}
