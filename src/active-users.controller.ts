import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { subDays } from 'date-fns';
import { PXParams, User, UserFilter, UserSort } from './model/gainsight-px.model';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { NormalizedDateCacheInterceptor } from './service/normalized-date-cache-interceptor.service';

@Controller()
export class ActiveUserController {
  readonly logger = new Logger(ActiveUserController.name);
  cachedRequest: Promise<User[]>;
  cacheExpiry: number;

  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {}

  @Get('/activeUserMetricsDateRange')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getActiveUserMetricsDateRange(@Query('start') start?: string, @Query('end') end?: string) {
    let filter = 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com;';
    if (start) {
      const date = new Date(start);
      filter += `lastSeenDate>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `lastSeenDate<${date.getTime()};`;
    }
    const params: PXParams<UserFilter, UserSort> = { filter: filter as UserFilter, sort: '-lastSeenDate', pageSize: 1000 };
    return this.api.getUsers(params);
  }

  @Get('/activeUserMetrics')
  @UseInterceptors(CacheInterceptor)
  async getActiveUserMetrics() {
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

  private getActiveUsers() {
    if (!this.cachedRequest || !this.cacheExpiry || Date.now() > this.cacheExpiry) {
      this.cachedRequest = this.getActiveUserMetrics();
      this.cacheExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    }
    return this.cachedRequest;
  }

  @Get('/activeUserMetrics/numberOfUsers')
  @UseInterceptors(CacheInterceptor)
  async numberOfUsers() {
    const users = await this.getActiveUsers();
    return this.userUtil.numberOfUsers(users);
  }

  @Get('/activeUserMetrics/newSignups')
  @UseInterceptors(CacheInterceptor)
  async numberOfNewSignups(@Query() query: Record<string, string>) {
    this.logger.log(JSON.stringify(query));
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
