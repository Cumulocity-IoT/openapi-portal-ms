import { Controller, Get } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { subDays } from 'date-fns';

@Controller()
export class AppController {
  constructor(private api: GainsightPxService) {
    // this.scheduler.handleCron();
  }

  @Get('/health')
  checkHealth() {
    return {
      status: 'UP',
    };
  }

  // ==============================

  @Get('/activeUsers')
  async getActiveUsers() {
    const users = await this.api.getUsers({
      filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
      sort: '-lastSeenDate',
      pageSize: 1000,
    });

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);

    const last30Days = users.users.filter((user) => new Date(user.lastSeenDate) >= thirtyDaysAgo);
    const anonymized = this.api.removePrivacyData(last30Days);
    return anonymized;
  }

  @Get('/customEvents')
  async getCustomEvents() {
    // @ts-ignore
    const customEvents = await this.api.getCustomEvents({ filter: 'accountId~t2700*', sort: '-date', pageSize: 100 });
    return customEvents;
  }

  @Get('/widgetEvents')
  async getWidgetEvents() {
    // @ts-ignore
    const customEvents = await this.api.getCustomEvents({ filter: 'eventName==loadWidget;accountId~t2700*', sort: '-date', pageSize: 1000 });
    const transformed = customEvents.customEvents
      .filter((event) => !event.globalContext['projectName'] || event.globalContext['projectName'].includes('devicemanagement'))
      .map((event) => {
        return {
          date: event.date,
          eventName: event.eventName,
          widgetName: event.attributes?.widgetName,
          sessionId: event.sessionId,
        };
      });
    return transformed;
  }
}
