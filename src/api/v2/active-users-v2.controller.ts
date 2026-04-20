import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ActiveUsersCacheService } from "../../cache/active-users-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import {
  ControllerUser,
  ControllerUserFieldList,
  ControllerUserResponse,
  mapCachedUserToControllerUser,
} from "../../model/controller-model";
import {
  filterArray,
  parseFieldList,
  parseOrderBy,
  projectData,
  sortArray,
} from "../../util/dynamic-queries";

@UseGuards(TenantGuard)
@ApiBasicAuth()
@ApiTags("v2")
@Controller()
export class ActiveUserControllerV2 {
  private readonly logger = new Logger(ActiveUserControllerV2.name);
  constructor(private cache: ActiveUsersCacheService) {}

  /**
   * Returns active users from the cache within the given time range, with optional filtering and field projection.
   *
   * @param start - Start of the time range (ISO 8601 string or epoch ms).
   * @param end - End of the time range (ISO 8601 string or epoch ms).
   * @param tenantId - Tenant identifier used to scope the cache query.
   * @param filter - Optional filtrex filter expression applied after mapping.
   * @param fields - Optional comma-separated user fields to include.
   * @returns Filtered, mapped, and projected user objects; empty array on error.
   */
  @ApiOperation({
    summary: "v2/activeUsers",
    description:
      "Supports optional server-side filtering via filtrex (https://github.com/cshaa/filtrex) " +
      "and field projection. All string values in filter expressions must be double-quoted.",
  })
  @ApiQuery({
    name: "filter",
    required: false,
    description:
      "filtrex filter expression applied to mapped user objects. Strings must be double-quoted.\n\n" +
      "**Examples**\n" +
      '- `country == "Germany"` — users from Germany\n' +
      '- `platform == "desktop" and browser == "Chrome"` — desktop Chrome users\n' +
      '- `device in ("mobile", "tablet")` — mobile and tablet users only\n' +
      '- `roles != "guest"` — exclude guest users\n' +
      '- `domain ~= "siemens"` — users whose email domain contains "siemens"',
  })
  @ApiQuery({
    name: "fields",
    required: false,
    description:
      "Comma-separated user fields to return. Valid values: id, roles, country, sessionId, language, platform, browser, device, domain. Omit to return all fields.\n\n" +
      "**Examples**\n" +
      "- `id,country,roles` — identity, location, and role breakdown\n" +
      "- `id,platform,browser,device` — device and browser profile only\n" +
      "- `id,domain,language` — domain and language breakdown",
  })
  @ApiQuery({
    name: "orderBy",
    required: false,
    description:
      "Field and optional direction to sort results by, in the format `field` or `field:asc` / `field:desc`. " +
      "Direction defaults to `asc` when omitted. Valid field values match those listed in `fields`.\n\n" +
      "**Examples**\n" +
      "- `country:asc` — alphabetical by country\n" +
      "- `domain:asc` — alphabetical by domain\n" +
      "- `language:asc` — alphabetical by language\n" +
      "- `platform:desc` — reverse-alphabetical by platform",
  })
  @ApiResponse({
    status: 200,
    description: "Filtered and projected active user objects.",
    schema: {
      example: [
        {
          id: "user-001",
          roles: ["admin", "developer"],
          country: "Germany",
          sessionId: "sess-abc123",
          language: "de",
          platform: "desktop",
          browser: "Chrome",
          device: "desktop",
          domain: "example.com",
        },
      ],
    },
  })
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
  @Get("v2/activeUsers")
  getUsersV2(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
    @Query("filter") filter?: string,
    @Query("fields") fields?: ControllerUserFieldList,
    @Query("orderBy") orderBy?: string,
  ): ControllerUserResponse[] {
    this.logger.verbose(
      `getUsers from ${start} to ${end} for tenant ${tenantId}`,
    );
    try {
      const users = this.cache.queryCache(start, end, tenantId);
      const mappedUsers = users.map(mapCachedUserToControllerUser);
      const filtered = filterArray(mappedUsers, filter);
      const orderConfig = parseOrderBy(orderBy);
      const sorted = orderConfig
        ? sortArray(
            filtered,
            orderConfig.field as keyof ControllerUser,
            orderConfig.direction,
          )
        : filtered;
      const fieldList = parseFieldList(fields);
      return sorted.map((user) => {
        const projectedData = projectData(
          user,
          fieldList as (keyof ControllerUser)[],
        );
        return { id: user.id, ...projectedData };
      });
    } catch (e) {
      this.logger.error("Error during getUsers", e);
      return [];
    }
  }
}
