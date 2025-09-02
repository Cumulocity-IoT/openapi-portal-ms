import { Controller, Get, Logger } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { subDays } from 'date-fns';
import { User } from './model/gainsight-px.model';

@Controller()
export class ActiveUserController {
  readonly logger = new Logger(ActiveUserController.name);

  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {}

  async getActiveUsers() {
    const users = await this.api.getUsers({
      filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
      sort: '-lastSeenDate',
      pageSize: 1000,
    });

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const rule = (user: User) => new Date(user.lastSeenDate) >= thirtyDaysAgo;

    const allUsers = await this.getUsersWithPagination(rule, []);
    if (allUsers.length) {
      this.logger.log(`Active Users - first on ${new Date(allUsers[0].lastSeenDate).toISOString()}, last on ${new Date(allUsers[allUsers.length - 1].lastSeenDate).toISOString()}`);
    }

    return allUsers;
  }

  @Get('/activeUserMetrics/numberOfUsers')
  async numberOfUsers() {
    const users = await this.getActiveUsers();
    return this.userUtil.numberOfUsers(users);
  }

  @Get('/activeUserMetrics/newSignups')
  async numberOfNewSignups() {
    const users = await this.getActiveUsers();
    return this.userUtil.numberOfNewSignups(users);
  }

  @Get('/activeUserMetrics/topLanguages')
  async topLanguages() {
    const users = await this.getActiveUsers();
    return this.userUtil.topLanguages(users);
  }

  @Get('/activeUserMetrics/topUserRoles')
  async topUserRoles() {
    const users = await this.getActiveUsers();
    return this.userUtil.topUserRoles(users);
  }

  @Get('/activeUserMetrics/topCountries')
  async topCountries() {
    const users = await this.getActiveUsers();
    return this.userUtil.topCountries(users);
  }

  @Get('/activeUserMetrics/topPlatforms')
  async topPlatforms() {
    const users = await this.getActiveUsers();
    return this.userUtil.topPlatforms(users);
  }

  @Get('/activeUserMetrics/topBrowsers')
  async topBrowsers() {
    const users = await this.getActiveUsers();
    return this.userUtil.topBrowsers(users);
  }

  @Get('/activeUserMetrics/topDeviceTypes')
  async topDeviceTypes() {
    const users = await this.getActiveUsers();
    return this.userUtil.topDeviceTypes(users);
  }

  @Get('/activeUserMetrics/mailDomainNames')
  async mailDomainNames() {
    const users = await this.getActiveUsers();
    return this.userUtil.mailDomainNames(users);
  }

  async getUsersWithPagination(rule: (user: User) => boolean, sum: User[], scrollId?: string): Promise<User[]> {
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
      return this.getUsersWithPagination(rule, sum, res.scrollId);
    }
  }
}
