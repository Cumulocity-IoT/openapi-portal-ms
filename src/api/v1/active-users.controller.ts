import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import { ApiBasicAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { UserUtilityService } from "../../service/user-utility.service";
import { ActiveUsersCacheService } from "../../cache/active-users-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import { mapCachedUserToControllerUser } from "../../model/controller-model";

@UseGuards(TenantGuard)
@ApiBasicAuth()
@ApiTags("v1")
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUsers",
    description:
      "Returns all active users from the in-memory cache for the specified tenant within the given time range. " +
      "Each user object includes identity, browser, device, platform, country, language, and role information.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/numberOfUsers",
    description:
      "Returns the total count of distinct active users recorded within the given time range for the specified tenant. " +
      "Useful as a headline KPI on dashboards.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/newSignups",
    description:
      "Returns the count of users whose first recorded activity falls at or after the `start` boundary, " +
      "i.e. users who are new within the queried window. Useful for tracking user acquisition over time.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/topLanguages",
    description:
      "Returns the most common browser language codes among active users within the given time range, " +
      "sorted by frequency descending. Each entry contains a `value` (language code) and a `count`.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/topUserRoles",
    description:
      "Returns the most common user roles among active users within the given time range, " +
      "sorted by frequency descending. Each entry contains a `value` (role name) and a `count`.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/topCountries",
    description:
      "Returns the most common countries among active users within the given time range, " +
      "sorted by frequency descending. Each entry contains a `value` (country name) and a `count`.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/topPlatforms",
    description:
      "Returns the most common operating system platforms (e.g. Windows, macOS, Linux) among active users within the given time range, " +
      "sorted by frequency descending. Each entry contains a `value` (platform name) and a `count`.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/topBrowsers",
    description:
      "Returns the most common web browsers among active users within the given time range, " +
      "sorted by frequency descending. Each entry contains a `value` (browser name) and a `count`.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/topDeviceTypes",
    description:
      "Returns the most common device types (e.g. desktop, mobile, tablet) among active users within the given time range, " +
      "sorted by frequency descending. Each entry contains a `value` (device type) and a `count`.",
  })
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
  @ApiQuery({
    name: "start",
    required: true,
    description:
      "Start of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "end",
    required: true,
    description:
      "End of the time range (ISO 8601 string or epoch milliseconds).",
  })
  @ApiQuery({
    name: "tenantId",
    required: true,
    description: "Tenant identifier used to scope the cache query.",
  })
  @ApiOperation({
    summary: "/activeUserMetrics/mailDomainNames",
    description:
      "Extracts and counts the email domain portion of each active user's identifier within the given time range, " +
      "returning the most common domains sorted by frequency descending. " +
      "Useful for understanding which organisations are most active on the platform.",
  })
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
