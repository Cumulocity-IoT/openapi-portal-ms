import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { SessionEventsCacheService } from "../../cache/session-events-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  ControllerSessionEvent,
  ControllerSessionEventFieldList,
  ControllerSessionEventResponse,
  mapCachedSessionEventToControllerSessionEvent,
} from "../../model/controller-model";
import {
  filterArray,
  parseFieldList,
  parseOrderBy,
  projectData,
  sortArray,
} from "../../util/dynamic-queries";

@UseGuards(TenantGuard)
@Controller()
export class SessionEventsControllerV2 {
  private readonly logger = new Logger(SessionEventsControllerV2.name);

  constructor(private sessionEventsCacheService: SessionEventsCacheService) {}

  /**
   * Returns session-initialized events from the cache within the given time range, with optional filtering and field projection.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional comma-separated session event fields to include.
   * @returns Filtered, mapped, and projected session event objects; empty array on error.
   */
  @ApiOperation({
    summary:
      "Returns session-initialized events from the cache within the given time range.",
    description:
      "Supports optional server-side filtering via filtrex (https://github.com/cshaa/filtrex) " +
      "and field projection. All string values in filter expressions must be double-quoted.",
  })
  @ApiQuery({
    name: "filter",
    required: false,
    description:
      'filtrex filter expression. Strings must be double-quoted. Examples: userType == "USER", userType != "VISITOR", userType in ("USER", "LEAD").',
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description:
      "Comma-separated session event fields to return. Valid values: id, identifyId, sessionId, accountId, date, propertyKey, eventType, remoteHost, location, userType, globalContext. Omit to return all fields.",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    description:
      "Field and optional direction to sort results by, in the format `field` or `field:asc` / `field:desc`. " +
      "Direction defaults to `asc` when omitted. Valid field values match those listed in `fields`.\n\n" +
      "**Examples**\n" +
      "- `date:desc` — most recent sessions first\n" +
      "- `date:asc` — oldest sessions first\n" +
      "- `accountId:asc` — alphabetical by account\n" +
      "- `userType:asc` — alphabetical by user type",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered and projected session event objects.",
    schema: {
      example: [
        {
          id: "se-001",
          identifyId: "user-001",
          sessionId: "sess-abc123",
          accountId: "acc-001",
          date: "2024-01-15T10:30:00.000Z",
          propertyKey: "APX-12345",
          eventType: "SESSION_STARTED",
          remoteHost: "203.0.113.10",
          userType: "USER",
          location: { countryName: "Germany", regionName: "Bavaria" },
          globalContext: [],
        },
      ],
    },
  })
  @Get("v2/sessionEvents")
  getSessionsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerSessionEventFieldList,
    @Query("orderBy") orderBy?: string,
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
      const orderConfig = parseOrderBy(orderBy);
      const sorted = orderConfig
        ? sortArray(
            filtered,
            orderConfig.field as keyof ControllerSessionEvent,
            orderConfig.direction,
          )
        : filtered;
      const fieldList = parseFieldList(fields);
      return sorted.map((e) => {
        const projected = projectData(
          e,
          fieldList as (keyof ControllerSessionEvent)[],
        );
        return { id: e.id, ...projected };
      });
    } catch (e) {
      this.logger.error("Error during session events retrieval", e);
      return [];
    }
  }
}
