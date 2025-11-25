import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { get } from 'lodash';
import { ReducedEvent } from '../model/gainsight-px.model';
import { CustomEventsCacheService } from '../cache/custom-events-cache.service';
import { TenantGuard } from '../guards/tenant.guard';

@UseGuards(TenantGuard)
@Controller()
export class EventsController {
  readonly logger = new Logger(EventsController.name);

  constructor(private customEventsCache: CustomEventsCacheService) {}

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
