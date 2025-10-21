import { Controller, Get, Logger, Query } from '@nestjs/common';
import { CustomEvent } from '../model/gainsight-px.model';
import { CustomEventsCacheService } from '../cache/custom-events-cache.service';
import { get } from 'lodash';

@Controller()
export class EventsController {
  readonly logger = new Logger(EventsController.name);

  constructor(private customEventsCache: CustomEventsCacheService) {}

  @Get('/eventCounts')
  async getEventCounts(@Query('start') start?: string, @Query('end') end?: string) {
    this.logger.log(`getEventCounts from ${start} to ${end}`);
    try {
      const allEvents = await this.customEventsCache.queryCache(start, end);
      const filtered = this.filteredByProjectName(allEvents, 'devicemanagement');
      return this.aggregateEventCountsBy(filtered, 'eventName');
    } catch (e) {
      this.logger.error('Error during event count aggregation', e);
      return [];
    }
  }

  private filteredByProjectName(customEvents: CustomEvent[], projectName: string) {
    return customEvents.filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes(projectName));
  }

  private aggregateEventCountsBy(customEvents: CustomEvent[], by: string): { value: string; count: number }[] {
    const counts: Record<string, number> = {};
    customEvents.forEach((event) => {
      const name = get(event, by) || 'unknown';
      if (!counts[name]) {
        counts[name] = 0;
      }
      counts[name]++;
    });
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  @Get('/widgetsByName')
  async getEventCountsByName(@Query('eventName') eventName: string, @Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`getEventCountsByName for event ${eventName} from ${start} to ${end}`);
    try {
      const allEvents = await this.customEventsCache.queryCache(start, end);
      const filtered = this.filteredByProjectName(allEvents, 'devicemanagement').filter((event) => event.eventName === eventName);
      return this.aggregateEventCountsBy(filtered, 'attributes.widgetName');
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
