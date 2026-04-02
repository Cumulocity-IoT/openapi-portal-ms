import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { UserUtilityService } from "../service/user-utility.service";
import { ActiveUsersCacheService } from "../cache/active-users-cache.service";
import { TenantGuard } from "../guards/tenant.guard";

@UseGuards(TenantGuard)
@Controller()
export class ActiveUserController {
  private readonly logger = new Logger(ActiveUserController.name);
  constructor(
    private cache: ActiveUsersCacheService,
    private userUtil: UserUtilityService,
  ) {}

  @Get("/activeUsers")
  getUsers(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `getUsers from ${start} to ${end} for tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return users.map((u) => {
        const roleString = u.customAttributes?.userRoles ?? "-";
        const roles = roleString.split(",").map((r) => r.trim());
        const country = u.lastInferredLocation?.countryName ?? "-";
        return { id: u.identifyId, roles, country };
      });
    } catch (e) {
      this.logger.error("Error during getUsers", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/numberOfUsers")
  numberOfUsers(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `numberOfUsers from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.numberOfUsers(users);
    } catch (e) {
      this.logger.error("Error during numberOfUsers calculation", e);
      return { count: 0 };
    }
  }

  @Get("/activeUserMetrics/newSignups")
  numberOfNewSignups(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `numberOfNewSignups from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.numberOfNewSignups(users, start);
    } catch (e) {
      this.logger.error("Error during numberOfNewSignups calculation", e);
      return { count: 0 };
    }
  }

  @Get("/activeUserMetrics/topLanguages")
  topLanguages(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `topLanguages from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topLanguages(users);
    } catch (e) {
      this.logger.error("Error during topLanguages calculation", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/topUserRoles")
  topUserRoles(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `topUserRoles from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topUserRoles(users);
    } catch (e) {
      this.logger.error("Error during topUserRoles calculation", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/topCountries")
  topCountries(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `topCountries from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topCountries(users);
    } catch (e) {
      this.logger.error("Error during topCountries calculation", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/topPlatforms")
  topPlatforms(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `topPlatorms from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topPlatforms(users);
    } catch (e) {
      this.logger.error("Error during topPlatforms calculation", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/topBrowsers")
  topBrowsers(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `topBrowsers from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topBrowsers(users);
    } catch (e) {
      this.logger.error("Error during topBrowsers calculation", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/topDeviceTypes")
  topDeviceTypes(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `topDeviceTypes from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.topDeviceTypes(users);
    } catch (e) {
      this.logger.error("Error during topDeviceTypes calculation", e);
      return [];
    }
  }

  @Get("/activeUserMetrics/mailDomainNames")
  mailDomainNames(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `mailDomainNames from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      return this.userUtil.mailDomainNames(users);
    } catch (e) {
      this.logger.error("Error during mailDomainNames calculation", e);
      return [];
    }
  }
}
