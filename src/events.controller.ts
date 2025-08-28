import { Controller, Get, Logger } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { CustomEvent, CustomEventFilter } from './model/gainsight-px.model';
import { subDays } from 'date-fns';

@Controller()
export class EventsController {
  readonly logger = new Logger(EventsController.name);

  constructor(private api: GainsightPxService) {}

  @Get('/customEventsToday')
  async getCustomEventsToday() {
    // @ts-ignore
    // always returns latest date first, only returns for today
    const filter = 'accountId~t2700*;globalContext.projectName==devicemanagement' as CustomEventFilter;
    this.logger.log(`Fetching custom events for today: ${filter}`);
    const customEvents = await this.api.getCustomEvents({ filter, sort: 'date', pageSize: 1000 });
    this.logger.log(`Fetched ${customEvents.customEvents.length} custom events.`);
    return customEvents;
  }

  @Get('/customEventsLastMonth')
  async getCustomEventsLastMonth() {
    // @ts-ignore
    // always returns latest date first, only returns for today
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const last30Days = subDays(date, 30);

    const filter = `accountId~t2700*;date>${last30Days.getTime()};globalContext.projectName==devicemanagement` as CustomEventFilter;
    this.logger.log(`Fetching custom events for today: ${filter} (date: ${last30Days.toISOString()})`);
    const customEvents = await this.api.getCustomEvents({ filter, sort: 'date', pageSize: 1000 });

    if (!customEvents.customEvents || customEvents.customEvents.length === 0) {
      this.logger.log('No events found for the last 30 days.');
      return [];
    } else if (customEvents.customEvents.length < 1000) {
      this.logger.log(`Received ${customEvents.customEvents.length} events. No pagination needed.`);
      return customEvents.customEvents;
    } else {
      this.logger.log('More than 1000 custom events found, fetching with pagination...');
      const allEvents = await this.getEventWithPagination(customEvents.scrollId, customEvents.customEvents, filter);
      return allEvents;
    }
  }

  private async getEventWithPagination(scrollId: string, sum: CustomEvent[], filter: CustomEventFilter): Promise<CustomEvent[]> {
    const res = await this.api.getCustomEvents({
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    });

    sum.push(...res.customEvents);
    this.logger.log(`Pagination - received ${res.customEvents.length} custom events - overall count ${sum.length} events.`);
    if (res.customEvents.length < 1000) {
      return sum;
    } else {
      return this.getEventWithPagination(res.scrollId, sum, filter);
    }
  }

  @Get('/widgetEvents')
  async getWidgetEvents() {
    // @ts-ignore
    const customEvents = await this.api.getCustomEvents({ filter: 'eventName==loadWidget;accountId~t2700*', sort: '-date', pageSize: 1000 });
    return this.filterByApplication(customEvents.customEvents, 'devicemanagement');
  }

  private filterByApplication(customEvents: CustomEvent[], application: string) {
    return customEvents
      .filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes(application))
      .map((event) => {
        return {
          date: event.date,
          eventName: event.eventName,
          widgetName: event.attributes?.widgetName,
          sessionId: event.sessionId,
        };
      });
  }

  @Get('/widgetEventCounts')
  async getWidgetCounts() {
    const events = await this.getWidgetEvents();
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      const widgetName = event.widgetName || 'unknown';
      if (!counts[widgetName]) {
        counts[widgetName] = 0;
      }
      counts[widgetName]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }
}
