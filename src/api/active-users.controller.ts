import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { UserUtilityService } from '../service/user-utility.service';
import { ActiveUsersCacheService } from '../cache/active-users-cache.service';
import { TenantGuard } from '../guards/tenant.guard';

@UseGuards(TenantGuard)
@Controller()
export class ActiveUserController {
  private readonly logger = new Logger(ActiveUserController.name);
  constructor(
    private cache: ActiveUsersCacheService,
    private userUtil: UserUtilityService
  ) {}

  @Get('/activeUserMetrics/numberOfUsers')
  numberOfUsers(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`numberOfUsers from ${start} to ${end}`);
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.numberOfUsers(users);
    } catch (e) {
      this.logger.error('Error during numberOfUsers calculation', e);
      return { count: 0 };
    }
  }

  @Get('/activeUserMetrics/newSignups')
  async numberOfNewSignups(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`numberOfNewSignups from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.numberOfNewSignups(users, start);
    } catch (e) {
      this.logger.error('Error during numberOfNewSignups calculation', e);
      return { count: 0 };
    }
  }

  @Get('/activeUserMetrics/topLanguages')
  async topLanguages(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`topLanguages from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topLanguages(users);
    } catch (e) {
      this.logger.error('Error during topLanguages calculation', e);
      return [];
    }
  }

  @Get('/activeUserMetrics/topUserRoles')
  async topUserRoles(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`topUserRoles from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topUserRoles(users);
    } catch (e) {
      this.logger.error('Error during topUserRoles calculation', e);
      return [];
    }
  }

  @Get('/activeUserMetrics/topCountries')
  async topCountries(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`topCountries from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topCountries(users);
    } catch (e) {
      this.logger.error('Error during topCountries calculation', e);
      return [];
    }
  }

  @Get('/activeUserMetrics/topPlatforms')
  async topPlatforms(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`topPlatorms from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topPlatforms(users);
    } catch (e) {
      this.logger.error('Error during topPlatforms calculation', e);
      return [];
    }
  }

  @Get('/activeUserMetrics/topBrowsers')
  async topBrowsers(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`topBrowsers from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topBrowsers(users);
    } catch (e) {
      this.logger.error('Error during topBrowsers calculation', e);
      return [];
    }
  }

  @Get('/activeUserMetrics/topDeviceTypes')
  async topDeviceTypes(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`topDeviceTypes from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topDeviceTypes(users);
    } catch (e) {
      this.logger.error('Error during topDeviceTypes calculation', e);
      return [];
    }
  }

  @Get('/activeUserMetrics/mailDomainNames')
  async mailDomainNames(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.log(`mailDomainNames from ${start} to ${end}`);
    try {
      const users = await this.cache.queryCache(start, end, tenantId);
      return this.userUtil.mailDomainNames(users);
    } catch (e) {
      this.logger.error('Error during mailDomainNames calculation', e);
      return [];
    }
  }
}
