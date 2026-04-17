import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { CustomEventsCacheService } from "../../cache/custom-events-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  CachedEventDataFieldList,
  ControllerEventFieldList,
  ControllerEventResponse,
  mapCachedEventToControllerEvent,
} from "../../model/controller-model";
import { projectData, filterArray } from "../../util/dynamic-queries";
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
   * Returns events from the cache within the given time range, with optional
   * server-side filtering and field projection.
   *
   * **`filter`** — a [`filtrex`](https://github.com/cshaa/filtrex) expression
   * evaluated against each mapped event (`name`, `date`, `data`, `identifyId`,
   * `sessionId`). Strings must be **double-quoted**.
   *
   * | Goal | Expression |
   * |---|---|
   * | Single event type | `name == "buttonClick"` |
   * | Exclude an event type | `name != "pageView"` |
   * | Compound condition | `name == "formSubmit" and sessionId == "abc123"` |
   * | Multiple allowed names | `name in ("click", "hover", "focus")` |
   *
   * **`fields`** — comma-separated top-level fields to return from the mapped
   * event. Valid values: `name`, `date`, `data`, `identifyId`, `sessionId`.
   * When omitted, all top-level fields are returned.
   *
   * | Goal | Value |
   * |---|---|
   * | Name and date only | `name,date` |
   * | Include identity info | `name,date,identifyId,sessionId` |
   * | Full event (default) | _(omit param)_ |
   *
   * **`dataFields`** — comma-separated dot-notation paths to project from
   * `event.data`. When omitted, the full `data` object is returned.
   *
   * | Goal | Value |
   * |---|---|
   * | Single top-level key | `widgetName` |
   * | Nested key (flat output) | `attributes.size` |
   * | Multiple keys | `widgetName,attributes.size,user.id` |
   * | Full data payload (default) | _(omit param)_ |
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional {@link ControllerEventFieldList}: comma-separated top-level event fields to include.
   * @param dataFields - Optional {@link CachedEventDataFieldList}: comma-separated dot-notation paths to project from `event.data`.
   * @returns Filtered, mapped, and projected event objects; empty array on error.
   */
  @Get("v2/events")
  getEventsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerEventFieldList,
    @Query("dataFields") dataFields?: CachedEventDataFieldList,
  ): ControllerEventResponse[] {
    this.logger.verbose(`getEvents from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const mappedEvents = allEvents.map((e) =>
        mapCachedEventToControllerEvent(e),
      );
      const filtered = filterArray(mappedEvents, filter);
      const fieldList = fields ? fields.split(",").map((f) => f.trim()) : [];
      const dataFieldsList = dataFields
        ? dataFields.split(",").map((f) => f.trim())
        : [];
      return filtered.map((e) => {
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
   * Returns only customer-defined custom events (name prefix `customEvent*`)
   * from the cache within the given time range. The `data` field always
   * conforms to {@link CustomerCustomEventAttributes} (`action_type`, `category`,
   * `label`, `metadata`).
   *
   * This is a pre-filtered view of `v2/events` — only events whose `name`
   * starts with `customEvent` are included before any additional filtering
   * or projection is applied.
   *
   * **`filter`** — a [`filtrex`](https://github.com/cshaa/filtrex) expression
   * evaluated against each mapped event. Reference top-level fields or
   * known `data` sub-fields. Strings must be **double-quoted**.
   *
   * | Goal | Expression |
   * |---|---|
   * | Specific event name | `name == "customEventButtonClick"` |
   * | By action type | `name == "customEventTrack"` |
   * | Exclude a name | `name != "customEventPageLoad"` |
   * | Multiple names | `name in ("customEventClick", "customEventHover")` |
   *
   * **`dataFields`** — comma-separated dot-notation paths to project from
   * `event.data`. Valid values: `action_type`, `category`, `label`,
   * `metadata`, or nested paths inside `metadata` (e.g. `metadata.size`).
   * When omitted, the full `data` object is returned.
   *
   * | Goal | Value |
   * |---|---|
   * | Category and label only | `category,label` |
   * | Action and nested metadata | `action_type,metadata.size` |
   * | Full data payload (default) | _(omit param)_ |
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after the `customEvent*` pre-filter.
   * @param fields - Optional {@link ControllerEventFieldList}: comma-separated top-level event fields to include.
   * @param dataFields - Optional {@link CachedEventDataFieldList}: comma-separated dot-notation paths to project from `event.data`.
   * @returns Filtered, mapped, and projected customer custom event objects; empty array on error.
   */
  @Get("v2/customEvents")
  getCustomerEventsV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerEventFieldList,
    @Query("dataFields") dataFields?: CustomerCustomEventDataFieldList,
  ): CustomerCustomEventResponse[] {
    this.logger.verbose(
      `getCustomerEventsV2 from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const customerEvents = allEvents.filter(isCustomerCustomCachedEvent);
      const mappedEvents = customerEvents.map((e) =>
        mapCachedEventToControllerEvent(e),
      );
      const filtered = filterArray(mappedEvents, filter);
      const fieldList = fields ? fields.split(",").map((f) => f.trim()) : [];
      const dataFieldsList = dataFields
        ? dataFields.split(",").map((f) => f.trim())
        : [];
      return filtered.map((e) => {
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
