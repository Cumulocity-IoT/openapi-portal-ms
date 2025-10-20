import { Controller, Get, Logger, Query } from '@nestjs/common';
import { UserUtilityService } from '../service/user-utility.service';
import { ActiveUsersCacheService } from '../cache/active-users-cache.service';

@Controller()
export class ActiveUserController {
  private readonly logger = new Logger(ActiveUserController.name);
  constructor(
    private cache: ActiveUsersCacheService,
    private userUtil: UserUtilityService
  ) {}

  @Get('/activeUserMetrics/numberOfUsers')
  async numberOfUsers(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`numberOfUsers from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.numberOfUsers(users);
  }

  @Get('/activeUserMetrics/newSignups')
  async numberOfNewSignups(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`numberOfNewSignups from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.numberOfNewSignups(users);
  }

  @Get('/activeUserMetrics/topLanguages')
  async topLanguages(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`topLanguages from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topLanguages(users);
  }

  @Get('/activeUserMetrics/topUserRoles')
  async topUserRoles(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`topUserRoles from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topUserRoles(users);
  }

  @Get('/activeUserMetrics/topCountries')
  async topCountries(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`topCountries from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topCountries(users);
  }

  @Get('/activeUserMetrics/topPlatforms')
  async topPlatforms(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`topPlatorms from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topPlatforms(users);
  }

  @Get('/activeUserMetrics/topBrowsers')
  async topBrowsers(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`topBrowsers from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topBrowsers(users);
  }

  @Get('/activeUserMetrics/topDeviceTypes')
  async topDeviceTypes(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`topDeviceTypes from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.topDeviceTypes(users);
  }

  @Get('/activeUserMetrics/mailDomainNames')
  async mailDomainNames(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`mailDomainNames from ${start} to ${end}`);
    const users = await this.cache.queryCache(start, end);
    return this.userUtil.mailDomainNames(users);
  }
}
