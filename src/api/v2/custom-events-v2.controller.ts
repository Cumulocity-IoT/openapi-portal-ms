import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { CustomEventsCacheService } from "../../cache/custom-events-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  CachedEventDataFieldList,
  ControllerEventFieldList,
  ControllerEventResponse,
  mapCachedEventToControllerEventV2,
} from "../../model/controller-model";
import { filterArray, parseFieldList, parseOrderBy, projectData, sortArray } from "../../util/dynamic-queries";
import {
  CustomerCustomEventDataFieldList,
  CustomerCustomEventResponse,
  isCustomerCustomCachedEvent,
} from "../../model/customer-custom-event.model";

@UseGuards(TenantGuard)
@Controller()
export class EventsControllerV2 {
  readonly logger = new Logger(EventsControllerV2.name);

  constructor(private customEventsCache: CustomEventsCacheService) {}

  /**
   * Returns events from the cache within the given time range, with optional filtering, field projection, and data sub-field projection.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional comma-separated top-level event fields to include.
   * @param dataFields - Optional comma-separated dot-notation paths to project from event.data.
   * @returns Filtered, mapped, and projected event objects; empty array on error.
   */
  @ApiOperation({
    summary: "Returns events from the cache within the given time range.",
    description:
      "Supports optional server-side filtering via filtrex (https://github.com/cshaa/filtrex), " +
      "field projection, and data sub-field projection. All string values in filter expressions must be double-quoted.",
  })
  @ApiQuery({
    name: "filter",
    required: false,
    description:
      'filtrex filter expression. Strings must be double-quoted. Examples: name == "buttonClick", name != "pageView", name in ("click", "hover").',
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description:
      "Comma-separated top-level event fields to return. Valid values: name, date, data, identifyId, sessionId. Omit to return all fields.",
  })
  @ApiQuery({
    name: "dataFields",
    required: false,
    description:
      "Comma-separated dot-notation paths to project from event.data. Example: widgetName,attributes.size. Omit to return the full data object.",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    description:
      "Field and optional direction to sort results by, in the format `field` or `field:asc` / `field:desc`. " +
      "Direction defaults to `asc` when omitted. Valid field values match those listed in `fields`.\n\n" +
      "**Examples**\n" +
      "- `date:desc` — most recent events first\n" +
      "- `date:asc` — oldest events first\n" +
      "- `name:asc` — alphabetical by event name\n" +
      "- `identifyId:asc` — alphabetical by user",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered and projected event objects.",
    schema: {
      example: [
        {
          name: "buttonClick",
          date: "2024-01-15T10:30:00.000Z",
          data: { widgetName: "SaveButton", widgetId: "save-btn" },
          identifyId: "user-001",
          sessionId: "sess-abc123",
        },
      ],
    },
  })
  @Get("v2/events")
  getEventsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerEventFieldList,
    @Query("dataFields") dataFields?: CachedEventDataFieldList,
    @Query("orderBy") orderBy?: string,
  ): ControllerEventResponse[] {
    this.logger.verbose(`getEvents from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const mappedEvents = allEvents.map(mapCachedEventToControllerEventV2);
      const filtered = filterArray(mappedEvents, filter);
      const orderConfig = parseOrderBy(orderBy);
      const sorted = orderConfig
        ? sortArray(filtered, orderConfig.field as any, orderConfig.direction)
        : filtered;
      const fieldList = parseFieldList(fields);
      const dataFieldsList = parseFieldList(dataFields);
      return sorted.map((e) => {
        const projectedEvent = projectData(e as any, fieldList);
        const projectedDataFields = projectData(e.data, dataFieldsList);
        return {
          name: e.name,
          ...projectedEvent,
          data: { ...projectedDataFields },
        };
      });
    } catch (e) {
      this.logger.error("Error during event retrieval", e);
      return [];
    }
  }

  /**
   * Returns customer custom events (name prefixed with "customEvent") from the cache, with optional filtering and data projection.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after the customEvent prefix pre-filter.
   * @param fields - Optional comma-separated top-level event fields to include.
   * @param dataFields - Optional comma-separated dot-notation paths to project from event.data.
   * @returns Filtered, mapped, and projected customer custom event objects; empty array on error.
   */
  @ApiOperation({
    summary:
      'Returns customer custom events (name prefixed with "customEvent") from the cache.',
    description:
      'Pre-filtered to events whose name starts with "customEvent". ' +
      "The data field always conforms to CustomerCustomEventAttributes (action_type, category, label, metadata). " +
      "Supports optional filtrex filtering (https://github.com/cshaa/filtrex) and data sub-field projection. " +
      "All string values in filter expressions must be double-quoted.",
  })
  @ApiQuery({
    name: "filter",
    required: false,
    description:
      'filtrex filter expression applied after the customEvent prefix pre-filter. Strings must be double-quoted. Examples: name == "customEventButtonClick", name in ("customEventClick", "customEventHover").',
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description:
      "Comma-separated top-level event fields to return. Valid values: name, date, data, identifyId, sessionId. Omit to return all fields.",
  })
  @ApiQuery({
    name: "dataFields",
    required: false,
    description:
      "Comma-separated dot-notation paths to project from event.data. Valid root values: action_type, category, label, metadata. Example: category,label,metadata.size. Omit to return the full data object.",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    description:
      "Field and optional direction to sort results by, in the format `field` or `field:asc` / `field:desc`. " +
      "Direction defaults to `asc` when omitted. Valid field values match those listed in `fields`.\n\n" +
      "**Examples**\n" +
      "- `date:desc` — most recent events first\n" +
      "- `date:asc` — oldest events first\n" +
      "- `name:asc` — alphabetical by event name\n" +
      "- `identifyId:asc` — alphabetical by user",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered and projected customer custom event objects.",
    schema: {
      example: [
        {
          name: "customEventButtonClick",
          date: "2024-01-15T10:30:00.000Z",
          data: {
            action_type: "click",
            category: "UI",
            label: "SaveButton",
            metadata: {},
          },
          identifyId: "user-001",
          sessionId: "sess-abc123",
        },
      ],
    },
  })
  @Get("v2/customEvents")
  getCustomerEventsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerEventFieldList,
    @Query("dataFields") dataFields?: CustomerCustomEventDataFieldList,
    @Query("orderBy") orderBy?: string,
  ): CustomerCustomEventResponse[] {
    this.logger.verbose(
      `getCustomerEventsV2 from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const customerEvents = allEvents.filter(isCustomerCustomCachedEvent);
      const mappedEvents = customerEvents.map(
        mapCachedEventToControllerEventV2,
      );
      const filtered = filterArray(mappedEvents, filter);
      const orderConfig = parseOrderBy(orderBy);
      const sorted = orderConfig
        ? sortArray(filtered, orderConfig.field as any, orderConfig.direction)
        : filtered;
      const fieldList = parseFieldList(fields);
      const dataFieldsList = parseFieldList(dataFields);
      return sorted.map((e) => {
        const projectedEvent = projectData(e, fieldList);
        const projectedDataFields = projectData(e.data, dataFieldsList);
        return {
          ...projectedEvent,
          data: { ...projectedDataFields },
          name: e.name as `customEvent${string}`,
        };
      });
    } catch (e) {
      this.logger.error("Error during customer event retrieval", e);
      return [];
    }
  }
}
