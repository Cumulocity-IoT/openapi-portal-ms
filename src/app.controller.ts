import { Controller, Get } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { subDays } from 'date-fns';
import { CustomEvent, User } from './model/gainsight-px.model';
import { UserUtilityService } from './service/user-utility.service';

@Controller()
export class AppController {
  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {
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
      pageSize: 100,
    });

    if (!users.users || users.users.length === 0) {
      return [];
    }

    if (users.users.length === 100) {
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const filter = (user: User) => new Date(user.lastSeenDate) >= thirtyDaysAgo;
    const allUsers = await this.getUsersWithPagination(users.scrollId, users.users, filter);
    return allUsers;
  }

  @Get('/activeUserMetrics')
  async getActiveUserMetrics() {
    const users = await this.getActiveUsers();
    return {
      ...this.userUtil.numberOfUsers(users),
      ...this.userUtil.numberOfNewSignups(users),
      ...this.userUtil.top50Users(users),
      ...this.userUtil.topLanguages(users),
      ...this.userUtil.topUserRoles(users),
      ...this.userUtil.topCountries(users),
      ...this.userUtil.topPlatforms(users),
      ...this.userUtil.topBrowsers(users),
      ...this.userUtil.topDeviceTypes(users),
    };
  }

  async getUsersWithPagination(scrollId: string, sum: User[], rule: (user: User) => boolean): Promise<User[]> {
    const res = await this.api.getUsers({
      filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
      sort: '-lastSeenDate',
      pageSize: 100,
      scrollId,
    });

    if (res.users.length <= 100) {
      const filtered = res.users.filter(rule);
      sum.push(...filtered);
      return sum;
    }

    const lastUser = res.users[res.users.length - 1];
    if (rule(lastUser) === false) {
      const filtered = res.users.filter((u) => rule(u));
      sum.push(...filtered);
      return sum;
    } else {
      sum.push(...res.users);
      return this.getUsersWithPagination(res.scrollId, sum, rule);
    }
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
