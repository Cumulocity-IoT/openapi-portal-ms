import { Controller, Logger } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { PXParams, User, UserFilter, UserSort } from './model/gainsight-px.model';

@Controller()
export class ActiveUserController {
  readonly logger = new Logger(ActiveUserController.name);
  cachedRequest: Record<string, Promise<User[]>> = {};
  cacheExpiry: Record<string, number> = {};

  constructor(
    private api: GainsightPxService,
    private userUtil: UserUtilityService
  ) {}

  async getActiveUserMetricsDateRange(start: string, end: string, domainName: string) {
    let filter = `customAttributes.domainName==${domainName};`;

    const dateFrom = new Date(start);
    filter += `lastSeenDate>${dateFrom.getTime()};`;

    const dateTo = new Date(end);
    filter += `lastSeenDate<${dateTo.getTime()};`;

    const params: PXParams<UserFilter, UserSort> = { filter: filter as UserFilter, sort: '-lastSeenDate', pageSize: 1000 };
    return this.api.getUsers(params).then((res) => res.users);
  }

  // @Get('/activeUserMetrics/numberOfUsers')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async numberOfUsers(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.numberOfUsers(users);
  // }

  // @Get('/activeUserMetrics/newSignups')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async numberOfNewSignups(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.numberOfNewSignups(users);
  // }

  // @Get('/activeUserMetrics/topLanguages')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async topLanguages(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.topLanguages(users);
  // }

  // @Get('/activeUserMetrics/topUserRoles')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async topUserRoles(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.topUserRoles(users);
  // }

  // @Get('/activeUserMetrics/topCountries')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async topCountries(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.topCountries(users);
  // }

  // @Get('/activeUserMetrics/topPlatforms')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async topPlatforms(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.topPlatforms(users);
  // }

  // @Get('/activeUserMetrics/topBrowsers')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async topBrowsers(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.topBrowsers(users);
  // }

  // @Get('/activeUserMetrics/topDeviceTypes')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async topDeviceTypes(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.topDeviceTypes(users);
  // }

  // @Get('/activeUserMetrics/mailDomainNames')
  // @UseInterceptors(NormalizedDateCacheInterceptor)
  // async mailDomainNames(@Query('start') start?: string, @Query('end') end?: string) {
  //   const users = await this.getActiveUserMetricsDateRange(start, end);
  //   return this.userUtil.mailDomainNames(users);
  // }
}
