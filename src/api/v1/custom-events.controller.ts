import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { ApiBasicAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { get } from "lodash";
import { CustomEventsCacheService } from "../../cache/custom-events-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import { CachedEvent } from "../../model/cache-model";
import { mapCachedEventToControllerEvent } from "../../model/controller-model";

@UseGuards(TenantGuard)
@ApiBasicAuth()
@ApiTags("v1")
@Controller()
export class EventsController {
  readonly logger = new Logger(EventsController.name);

  constructor(private customEventsCache: CustomEventsCacheService) {}

  /**
   * Returns the count of each custom event type within the given time range,
   * sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
  @ApiQuery({
    name: "start",
    required: true,
    description: "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description: "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/eventCounts",
    description: "Queries the custom-events cache for the given tenant and time range, then groups events by their `name` field and counts occurrences. " + "Returns an array of `{ value, count }` pairs sorted by count descending — useful for a ranked event-type breakdown.",
  })
  @Get("/eventCounts")
  getEventCounts(@Query("start") start: string, @Query("end") end: string, @Query("tenantId") tenantId: string) {
    this.logger.log(`getEventCounts from ${start} to ${end}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      return this.aggregateEventCountsBy(allEvents, "name");
    } catch (e) {
      this.logger.error("Error during eventCounts", e);
      return [];
    }
  }

  private aggregateEventCountsBy(customEvents: CachedEvent[], by: string): { value: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const event of customEvents) {
      const name = get(event, by) || "unknown";
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Returns widget counts grouped by widget name for a specific event type
   * within the given time range.
   *
   * @param eventName - The event name to filter events by.
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
  @ApiQuery({
    name: "start",
    required: true,
    description: "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description: "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/widgetsByName",
    description:
      "Filters the custom-events cache to events matching the provided `eventName` query parameter, " + "then groups the results by `data.widgetName` and counts occurrences. " + "Returns an array of `{ value, count }` pairs sorted by count descending — useful for per-widget interaction breakdowns.",
  })
  @Get("/widgetsByName")
  getEventCountsByName(@Query("eventName") eventName: string, @Query("start") start: string, @Query("end") end: string, @Query("tenantId") tenantId: string) {
    this.logger.verbose(`getEventCountsByName for event ${eventName} from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const filtered = allEvents.filter((event) => event.name === eventName);
      return this.aggregateEventCountsBy(filtered, "data.widgetName");
    } catch (e) {
      this.logger.error("Error during getEventCountsByName", e);
      return [];
    }
  }

  /**
   * Returns all custom events within the given time range.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param withId - When true, includes the internal event ID in each response object.
   * @returns Array of mapped event objects; empty array on error.
   */
  @ApiQuery({
    name: "withId",
    required: false,
    type: Boolean,
    description: "When true, includes identifyId and sessionId in each event object. Defaults to false.",
  })
  @ApiQuery({
    name: "start",
    required: true,
    description: "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description: "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/events",
    description: "Returns all custom events from the cache within the given time range for the specified tenant. " + "Each event contains `name`, `date`, and `data`. " + "Set `withId=true` to also include `identifyId` and `sessionId` on each event object.",
  })
  @Get("/events")
  getEvents(@Query("start") start: string, @Query("end") end: string, @Query("tenantId") tenantId: string, @Query("withId") withId = false) {
    this.logger.verbose(`getEvents from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      return allEvents.map((e) => mapCachedEventToControllerEvent(e, withId));
    } catch (e) {
      this.logger.error("Error during event", e);
      return [];
    }
  }
}
