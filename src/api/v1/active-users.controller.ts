import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { UserUtilityService } from "../../service/user-utility.service";
import { ActiveUsersCacheService } from "../../cache/active-users-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import { mapCachedUserToControllerUser } from "../../model/controller-model";

@UseGuards(TenantGuard)
@Controller()
export class ActiveUserController {
  private readonly logger = new Logger(ActiveUserController.name);
  constructor(
    private cache: ActiveUsersCacheService,
    private userUtil: UserUtilityService,
  ) {}

  /**
   * Returns active users from the cache within the given time range.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of mapped user objects; empty array on error.
   */
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
      return users.map(mapCachedUserToControllerUser);
    } catch (e) {
      this.logger.error("Error during getUsers", e);
      return [];
    }
  }

  /**
   * Returns the total count of distinct active users within the given time range.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Object with a count property; count is 0 on error.
   */
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

  /**
   * Returns the count of new user sign-ups since the start of the given time range.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Object with a count property; count is 0 on error.
   */
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

  /**
   * Returns the most common browser languages among active users within the given
   * time range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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

  /**
   * Returns the most common user roles among active users within the given time
   * range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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

  /**
   * Returns the most common countries among active users within the given time
   * range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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

  /**
   * Returns the most common platforms among active users within the given time
   * range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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

  /**
   * Returns the most common browsers among active users within the given time
   * range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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

  /**
   * Returns the most common device types among active users within the given
   * time range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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

  /**
   * Returns the most common email domain names among active users within the
   * given time range, sorted by frequency in descending order.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @returns Array of value/count pairs sorted by count descending; empty array on error.
   */
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
