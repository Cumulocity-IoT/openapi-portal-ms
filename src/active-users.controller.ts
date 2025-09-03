import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { PXParams, User, UserFilter, UserSort } from './model/gainsight-px.model';
import { NormalizedDateCacheInterceptor } from './service/normalized-date-cache-interceptor.service';

@Controller()
export class ActiveUserController {
  readonly logger = new Logger(ActiveUserController.name);
  cachedRequest: Record<string, Promise<User[]>> = {};
  cacheExpiry: Record<string, number> = {};

  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {}

  async getActiveUserMetricsDateRange(start?: string, end?: string) {
    let filter = 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com;';
    if (start) {
      const date = new Date(start);
      filter += `lastSeenDate>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `lastSeenDate<${date.getTime()};`;
    }
    const key = `active-users:${filter}`;

    const cachedResponse = this.cachedRequest[key];
    const cachedExpiry = this.cacheExpiry[key];
    if (!cachedResponse || Date.now() > cachedExpiry) {
      const params: PXParams<UserFilter, UserSort> = { filter: filter as UserFilter, sort: '-lastSeenDate', pageSize: 1000 };
      this.logger.log('Active users - refreshing cache');
      this.cachedRequest[key] = this.api.getUsers(params).then((res) => res.users);
      this.cacheExpiry[key] = Date.now() + 60 * 1000; // 1 minute
    }

    return this.cachedRequest[key];
  }

  @Get('/activeUserMetrics/numberOfUsers')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async numberOfUsers(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.numberOfUsers(users);
  }

  @Get('/activeUserMetrics/newSignups')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async numberOfNewSignups(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.numberOfNewSignups(users);
  }

  @Get('/activeUserMetrics/topLanguages')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topLanguages(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.topLanguages(users);
  }

  @Get('/activeUserMetrics/topUserRoles')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topUserRoles(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.topUserRoles(users);
  }

  @Get('/activeUserMetrics/topCountries')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topCountries(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.topCountries(users);
  }

  @Get('/activeUserMetrics/topPlatforms')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topPlatforms(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.topPlatforms(users);
  }

  @Get('/activeUserMetrics/topBrowsers')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topBrowsers(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.topBrowsers(users);
  }

  @Get('/activeUserMetrics/topDeviceTypes')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topDeviceTypes(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.topDeviceTypes(users);
  }

  @Get('/activeUserMetrics/mailDomainNames')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async mailDomainNames(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.getActiveUserMetricsDateRange(start, end);
    return this.userUtil.mailDomainNames(users);
  }
}
