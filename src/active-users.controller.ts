import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { subDays } from 'date-fns';
import { User } from './model/gainsight-px.model';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
export class ActiveUserController {
  readonly logger = new Logger(ActiveUserController.name);

  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {}

  @Get('/activeUserMetrics')
  @UseInterceptors(CacheInterceptor)
  async getActiveUsers() {
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
  @UseInterceptors(CacheInterceptor)
  async numberOfUsers() {
    const users = await this.getActiveUsers();
    return this.userUtil.numberOfUsers(users);
  }

  @Get('/activeUserMetrics/newSignups')
  @UseInterceptors(CacheInterceptor)
  async numberOfNewSignups() {
    const users = await this.getActiveUsers();
    return this.userUtil.numberOfNewSignups(users);
  }

  @Get('/activeUserMetrics/topLanguages')
  @UseInterceptors(CacheInterceptor)
  async topLanguages() {
    const users = await this.getActiveUsers();
    return this.userUtil.topLanguages(users);
  }

  @Get('/activeUserMetrics/topUserRoles')
  @UseInterceptors(CacheInterceptor)
  async topUserRoles() {
    const users = await this.getActiveUsers();
    return this.userUtil.topUserRoles(users);
  }

  @Get('/activeUserMetrics/topCountries')
  @UseInterceptors(CacheInterceptor)
  async topCountries() {
    const users = await this.getActiveUsers();
    return this.userUtil.topCountries(users);
  }

  @Get('/activeUserMetrics/topPlatforms')
  @UseInterceptors(CacheInterceptor)
  async topPlatforms() {
    const users = await this.getActiveUsers();
    return this.userUtil.topPlatforms(users);
  }

  @Get('/activeUserMetrics/topBrowsers')
  @UseInterceptors(CacheInterceptor)
  async topBrowsers() {
    const users = await this.getActiveUsers();
    return this.userUtil.topBrowsers(users);
  }

  @Get('/activeUserMetrics/topDeviceTypes')
  @UseInterceptors(CacheInterceptor)
  async topDeviceTypes() {
    const users = await this.getActiveUsers();
    return this.userUtil.topDeviceTypes(users);
  }

  @Get('/activeUserMetrics/mailDomainNames')
  @UseInterceptors(CacheInterceptor)
  async mailDomainNames() {
    const users = await this.getActiveUsers();
    return this.userUtil.mailDomainNames(users);
  }

  async getUsersWithPagination(rule: (user: User) => boolean, sum: User[], scrollId?: string): Promise<User[]> {
    const res = await this.api.getUsers({
      filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
      sort: '-lastSeenDate',
      pageSize: 100,
      scrollId,
    });

    if (res.users.length < 100) {
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
