import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { CustomEvent, CustomEventFilter, CustomEventSort, PXParams } from './model/gainsight-px.model';
import { NormalizedDateCacheInterceptor } from './service/normalized-date-cache-interceptor.service';
import { MyCacheService } from './service/my-cache.service';
import { isToday, startOfDay, subDays } from 'date-fns';

@Controller()
export class EventsController {
  readonly logger = new Logger(EventsController.name);

  constructor(private api: GainsightPxService, private myCache: MyCacheService) {}

  @Get('/customEvents')
  async fetchCustomEvents(start: string, end: string) {
    let filter = `accountId~t2700*;` as CustomEventFilter;
    if (start) {
      const date = new Date(start);
      filter += `date>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `date<${date.getTime()};`;
    }

    const allEvents = await this.getEventWithPagination(filter, []);
    if (allEvents.length) {
      this.logger.log(`Range from ${new Date(allEvents[0].date).toISOString()} to ${new Date(allEvents[allEvents.length - 1].date).toISOString()}`);
    }
    return this.filterByApplication(allEvents, 'devicemanagement');
  }

  private async getEventWithPagination(filter: CustomEventFilter, sum: CustomEvent[], scrollId?: string): Promise<CustomEvent[]> {
    const params = { filter, sort: 'date', pageSize: 1000, scrollId } as PXParams<CustomEventFilter, CustomEventSort>;
    const res = await this.api.getCustomEvents(params);
    sum.push(...res.customEvents);
    if (res.customEvents.length < 1000) {
      this.logger.log(`Count ${sum.length}.`);
      return sum;
    } else {
      return this.getEventWithPagination(filter, sum, res.scrollId);
    }
  }

  @Get('/eventCounts')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getEventCounts(@Query('start') start?: string, @Query('end') end?: string) {
    let filter = `accountId~t2700*;` as CustomEventFilter;
    if (start) {
      const date = new Date(start);
      filter += `date>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `date<${date.getTime()};`;
    }
    const allEvents = await this.getEventWithPagination(filter, []);
    const filtered = allEvents.filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes('devicemanagement'));

    const counts: Record<string, number> = {};
    filtered.forEach((event) => {
      const name = event.eventName || 'unknown';
      if (!counts[name]) {
        counts[name] = 0;
      }
      counts[name]++;
    });
    return Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  @Get('/eventCountsByName')
  async getEventCountsByName(@Query('eventName') eventName: string, @Query('start') start?: string, @Query('end') end?: string) {
    let filter = `accountId~t2700*;eventName==${eventName};` as CustomEventFilter;
    if (start) {
      const date = new Date(start);
      filter += `date>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `date<${date.getTime()};`;
    }
    const allEvents = await this.getEventWithPagination(filter, []);
    const filtered = allEvents.filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes('devicemanagement'));

    const counts: Record<string, number> = {};
    filtered.forEach((event) => {
      const widgetName = event.attributes?.widgetName || 'unknown';
      if (!counts[widgetName]) {
        counts[widgetName] = 0;
      }
      counts[widgetName]++;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  filterByApplication(customEvents: CustomEvent[], application: string) {
    return customEvents
      .filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes(application))
      .map((event) => {
        return {
          date: new Date(event.date).toISOString(),
          widgetName: event.attributes?.widgetName,
          sessionId: event.sessionId,
        };
      });
  }
}
