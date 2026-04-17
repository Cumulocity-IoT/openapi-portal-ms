import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { SessionEventsCacheService } from "../../cache/session-events-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  ControllerSessionEvent,
  ControllerSessionEventFieldList,
  ControllerSessionEventResponse,
  mapCachedSessionEventToControllerSessionEvent,
} from "../../model/controller-model";
import { filterArray, projectData } from "../../util/dynamic-queries";

@UseGuards(TenantGuard)
@Controller()
export class SessionEventsControllerV2 {
  private readonly logger = new Logger(SessionEventsControllerV2.name);

  constructor(private sessionEventsCacheService: SessionEventsCacheService) {}

  /**
   * Returns session-initialized events from the cache within the given time
   * range, with optional server-side filtering and field projection.
   *
   * **`filter`** — a [`filtrex`](https://github.com/cshaa/filtrex) expression
   * evaluated against each mapped session event. Strings must be **double-quoted**.
   *
   * | Goal | Expression |
   * |---|---|
   * | Specific user type | `userType == "USER"` |
   * | Exclude visitors | `userType != "VISITOR"` |
   * | Specific property | `propertyKey == "APX-XXXXX"` |
   * | Compound condition | `userType == "USER" and eventType == "session_started"` |
   * | Multiple user types | `userType in ("USER", "LEAD")` |
   *
   * **`fields`** — comma-separated top-level fields to return from the mapped
   * session event. Valid values match the keys of {@link ControllerSessionEventFieldList}:
   * `id`, `identifyId`, `sessionId`, `accountId`, `date`, `propertyKey`,
   * `eventType`, `remoteHost`, `location`, `userType`, `globalContext`.
   * When omitted, all top-level fields are returned.
   *
   * | Goal | Value |
   * |---|---|
   * | Identity only | `id,identifyId,sessionId` |
   * | Time and location | `id,date,location` |
   * | Full session event (default) | _(omit param)_ |
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional {@link ControllerSessionEventFieldList}: comma-separated top-level session event fields to include.
   * @returns Filtered, mapped, and projected session event objects; empty array on error.
   */
  @Get("v2/sessionEvents")
  getSessionsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerSessionEventFieldList,
  ): ControllerSessionEventResponse[] {
    this.logger.verbose(
      `getSessionsV2 from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const allEvents = this.sessionEventsCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      const mappedEvents = allEvents.map(
        mapCachedSessionEventToControllerSessionEvent,
      );
      const filtered = filterArray(mappedEvents, filter);
      const fieldList: (keyof ControllerSessionEvent)[] = fields
        ? fields.split(",").map((f) => f.trim() as keyof ControllerSessionEvent)
        : [];
      return filtered.map((e) => {
        const projected = projectData(e, fieldList);
        return { id: e.id, ...projected };
      });
    } catch (e) {
      this.logger.error("Error during session events retrieval", e);
      return [];
    }
  }
}
