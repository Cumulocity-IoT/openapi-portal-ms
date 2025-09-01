import { Controller, Get } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { subDays } from 'date-fns';
import { User } from './model/gainsight-px.model';

@Controller()
export class ActiveUserController {
  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {}

  @Get('/activeUsers')
  async getActiveUsers() {
    const users = await this.api.getUsers({
      filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
      sort: '-lastSeenDate',
      pageSize: 1000,
    });

    if (!users.users || users.users.length === 0) {
      return [];
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const rule = (user: User) => new Date(user.lastSeenDate) >= thirtyDaysAgo;
    if (users.users.length < 1000) {
      const filtered = users.users.filter((u) => rule(u));
      return filtered;
    }

    const allUsers = await this.getUsersWithPagination(users.scrollId, users.users, rule);
    return allUsers;
  }

  @Get('/activeUserMetrics')
  async getActiveUserMetrics() {
    const users = await this.getActiveUsers();
    return {
      ...this.userUtil.numberOfUsers(users),
      ...this.userUtil.numberOfNewSignups(users),
      ...this.userUtil.topLanguages(users),
      ...this.userUtil.topUserRoles(users),
      ...this.userUtil.topCountries(users),
      ...this.userUtil.topPlatforms(users),
      ...this.userUtil.topBrowsers(users),
      ...this.userUtil.topDeviceTypes(users),
      ...this.userUtil.mailDomainNames(users),
    };
  }

  async getUsersWithPagination(scrollId: string, sum: User[], rule: (user: User) => boolean): Promise<User[]> {
    const res = await this.api.getUsers({
      filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
      sort: '-lastSeenDate',
      pageSize: 1000,
      scrollId,
    });

    if (res.users.length < 1000) {
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
}
