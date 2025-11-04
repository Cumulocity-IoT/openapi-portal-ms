import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { get } from 'lodash';
import { CustomEvent } from '../model/gainsight-px.model';
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
      return this.aggregateEventCountsBy(allEvents, 'eventName');
    } catch (e) {
      this.logger.error('Error during event count aggregation', e);
      return [];
    }
  }

  // private filteredByProjectName(customEvents: CustomEvent[], projectName: string) {
  //   return customEvents.filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes(projectName));
  // }

  private aggregateEventCountsBy(customEvents: CustomEvent[], by: string): { value: string; count: number }[] {
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
    this.logger.log(`getEventCountsByName for event ${eventName} from ${start} to ${end}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      const filtered = allEvents.filter((event) => event.eventName === eventName);
      return this.aggregateEventCountsBy(filtered, 'attributes.widgetName');
    } catch (e) {
      this.logger.error('Error during event count by name aggregation', e);
      return [];
    }
  }

  @Get('/events')
  getEvents(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`getEvents from ${start} to ${end}`);
    try {
      const allEvents = this.customEventsCache.queryCache(start, end, tenantId);
      return allEvents;
    } catch (e) {
      this.logger.error('Error during event count by name aggregation', e);
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
