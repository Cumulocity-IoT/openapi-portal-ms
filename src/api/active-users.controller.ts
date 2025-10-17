import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { UserUtilityService } from '../service/user-utility.service';
import { ActiveUsersCacheService } from '../cache/active-users-cache.service';
import { NormalizedDateCacheInterceptor } from '../service/normalized-date-cache-interceptor.service';

@Controller()
export class ActiveUserController {
  constructor(
    private cache: ActiveUsersCacheService,
    private userUtil: UserUtilityService
  ) {}

  @Get('/activeUserMetrics/numberOfUsers')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async numberOfUsers(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.numberOfUsers(users);
  }

  @Get('/activeUserMetrics/newSignups')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async numberOfNewSignups(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.numberOfNewSignups(users);
  }

  @Get('/activeUserMetrics/topLanguages')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topLanguages(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topLanguages(users);
  }

  @Get('/activeUserMetrics/topUserRoles')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topUserRoles(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topUserRoles(users);
  }

  @Get('/activeUserMetrics/topCountries')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topCountries(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topCountries(users);
  }

  @Get('/activeUserMetrics/topPlatforms')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topPlatforms(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topPlatforms(users);
  }

  @Get('/activeUserMetrics/topBrowsers')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topBrowsers(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topBrowsers(users);
  }

  @Get('/activeUserMetrics/topDeviceTypes')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async topDeviceTypes(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topDeviceTypes(users);
  }

  @Get('/activeUserMetrics/mailDomainNames')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async mailDomainNames(@Query('start') start?: string, @Query('end') end?: string) {
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.mailDomainNames(users);
  }
}
