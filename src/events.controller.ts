import { Controller, Get } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { CustomEvent } from './model/gainsight-px.model';

@Controller()
export class EventsController {
  constructor(private api: GainsightPxService) {}

  @Get('/customEvents')
  async getCustomEvents() {
    // @ts-ignore
    const customEvents = await this.api.getCustomEvents({ filter: 'accountId~t2700*', sort: 'date', pageSize: 1000 });
    return customEvents;
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
