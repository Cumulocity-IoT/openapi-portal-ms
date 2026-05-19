import { Injectable, Logger } from "@nestjs/common";
import { PXParams, UserFilter, UserSort } from "../model/gainsight-px.model";
import { GainsightPxService } from "../service/gainsight-px.service";
import { ChronoArrayCache } from "./chrono-array-cache.service";
import { CachedUser, mapUsersToCachedUsers } from "../model/cache-model";

@Injectable()
export class ActiveUsersCacheService extends ChronoArrayCache<CachedUser> {
  constructor(private api: GainsightPxService) {
    super();
  }

  private readonly logger = new Logger(ActiveUsersCacheService.name);

  createOrUpdateCache(start: string, end: string, domain: { id: string; url: string; ttl?: number }): Promise<void> {
    const startDate = this.getStartDate(start, domain.id);
    return this.getActiveUserMetricsDateRange(startDate, end, domain.url).then((users) => {
      const cachedUsers = mapUsersToCachedUsers(users);
      this.setCache(cachedUsers, domain.id, domain.ttl);
    });
  }

  getDate(item: CachedUser): number {
    return item.date;
  }

  getLogger(): Logger {
    return this.logger;
  }

  queryCache(start: string, end: string, tenantId: string): CachedUser[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    const cached = this.getCache(startStamp, endStamp, tenantId);

    // dedupe by identifyId, keeping the entry with the newest lastSeenDate
    const byIdentify = new Map<string, CachedUser>();
    for (const u of cached) {
      const key = u.iId;
      const existing = byIdentify.get(key);
      if (!existing || u.date > existing.date) {
        byIdentify.set(key, u);
      }
    }

    const users = [...byIdentify.values()];
    return users;
  }

  private async getActiveUserMetricsDateRange(start: string, end: string, url: string) {
    let filter = `customAttributes.domainName==${url};`;

    const dateFrom = new Date(start);
    filter += `lastSeenDate>${dateFrom.getTime()};`;

    const dateTo = new Date(end);
    filter += `lastSeenDate<${dateTo.getTime()};`;

    const params: PXParams<UserFilter, UserSort> = {
      filter: filter as UserFilter,
      sort: "lastSeenDate",
      pageSize: 1000,
    };
    const { users } = await this.api.getUsers(params);
    this.logger.log(`Fetched ${users.length} active users for domain ${url} from ${start} to ${end}.`);
    return users;
  }
}
