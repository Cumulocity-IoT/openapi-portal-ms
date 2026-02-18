import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { get } from 'lodash';
import { ReducedEvent } from '../model/gainsight-px.model';
import { CustomEventsCacheService } from '../cache/custom-events-cache.service';
import { TenantGuard } from '../guards/tenant.guard';
import { projectData } from '../util/data-projection';
import { FilterService } from '../service/filter.service';

@UseGuards(TenantGuard)
@Controller()
export class EventsController {
  readonly logger = new Logger(EventsController.name);

  constructor(private customEventsCache: CustomEventsCacheService, private filterService: FilterService) {}

  @Get('/eventCounts')
  getEventCounts(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`getEventCounts from ${start} to ${end}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      return this.aggregateEventCountsBy(allEvents, 'name');
    } catch (e) {
      this.logger.error('Error during eventCounts', e);
      return [];
    }
  }

  // private filteredByProjectName(customEvents: CustomEvent[], projectName: string) {
  //   return customEvents.filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes(projectName));
  // }

  private aggregateEventCountsBy(customEvents: ReducedEvent[], by: string): { value: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const event of customEvents) {
      const name = get(event, by) || 'unknown';
      counts[name] = (counts[name] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  @Get('/widgetsByName')
  getEventCountsByName(@Query('eventName') eventName: string, @Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.verbose(`getEventCountsByName for event ${eventName} from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const filtered = allEvents.filter((event) => event.name === eventName);
      return this.aggregateEventCountsBy(filtered, 'data.widgetName');
    } catch (e) {
      this.logger.error('Error during getEventCountsByName', e);
      return [];
    }
  }

  @Get('/events')
  getEvents(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string, @Query('withId') withId = false) {
    this.logger.verbose(`getEvents from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      return allEvents.map((e) => ({
        name: e.name,
        data: e.data,
        date: new Date(e.date).toISOString(),
        ...(withId && {
          userId: e.userId,
          sessionId: e.sessionId,
        }),
      }));
    } catch (e) {
      this.logger.error('Error during event', e);
      return [];
    }
  }

    /**
    * getEventsV2
    *
    * Return events in the given time range. Supports an optional safe filter
    * expression (compiled with `filtrex`) and an optional comma-separated
    * `fields` list used to project properties from `event.data` into the
    * response objects.
    *
    * Filter (example and notes):
    * - Uses a simple, safe JavaScript-like expression language via `filtrex`.
    * - Examples:
    *   - `name == "click"` — match events whose `name` equals `click`.
    *   - `transactions <= 5 and abs(profit) > 20.5` — numeric comparisons.
    *   - `a.b.c in ("x","y")` — nested property membership check.
    * - Only numbers and strings are supported as primitive types; boolean
    *   logic is applied using truthy semantics. The expression is compiled to
    *   a function and executed against each event object.
    *
    * Fields (examples):
    * - Provide a comma-separated list of fields to include from `event.data`.
    * - Examples:
    *   - `a` → include `data.a` (as `a`) in the response.
    *   - `attributes.size, user.id` → include `attributes.size` and `user.id`.
    * - If omitted or empty, `projectData` returns the whole `data` object.
    *
    * @param start ISO date/string for the start of the range
    * @param end ISO date/string for the end of the range
    * @param tenantId tenant identifier
    * @param filter Optional filter expression (see examples above)
    * @param fields Optional comma-separated list of fields to project from `data`
    * @returns Array of events with `name`, ISO `date`, and projected fields
    */
  @Get('/events-v2')
  getEventsV2(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string, @Query('filter') filter?: string, @Query('fields') fields?: string) {
    this.logger.verbose(`getEvents from ${start} to ${end} tenant ${tenantId}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const filtered = this.filterService.filterArray(allEvents, filter);
      const fieldList = fields ? fields.split(',').map(f => f.trim()) : [];
      return filtered
        .map((e) => {
          const base = {
            name: e.name,
            date: new Date(e.date).toISOString(),
          };
          const projectedData = projectData(e.data, fieldList);
          return { ...base, ...projectedData };
        });
    } catch (e) {
      this.logger.error('Error during event', e);
      return [];
    }
  }

  // private minify(events: CustomEvent[]) {
  //   return events
  //     .map((event) => {
  //       return {
  //         date: new Date(event.date).toISOString(),
  //         widgetName: event.attributes?.widgetName,
  //         sessionId: event.sessionId,
  //       };
  //     });
  // }
}
