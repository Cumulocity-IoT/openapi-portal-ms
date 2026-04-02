import { Injectable, Logger } from "@nestjs/common";
import {
  PXParams,
  User,
  UserFilter,
  UserSort,
} from "../model/gainsight-px.model";
import { GainsightPxService } from "../service/gainsight-px.service";
import { TreeCache } from "./tree-cache.service";

@Injectable()
export class ActiveUsersCacheService extends TreeCache<User> {
  constructor(private api: GainsightPxService) {
    super();
  }

  private readonly logger = new Logger(ActiveUsersCacheService.name);

  createOrUpdateCache(
    start: string,
    end: string,
    domain: { id: string; url: string },
  ): Promise<void> {
    const startDate = this.getStartDate(start, domain.id);
    return this.getActiveUserMetricsDateRange(startDate, end, domain.url).then(
      (users) => this.setCache(users, domain.id),
    );
  }

  getDate(item: User): number {
    return item.lastSeenDate;
  }

  getLogger(): Logger {
    return this.logger;
  }

  queryCache(start: string, end: string, tenantId: string): User[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    const cached = this.getCache(startStamp, endStamp, tenantId);

    // dedupe by identifyId, keeping the entry with the newest lastSeenDate
    const byIdentify = new Map<string, User>();
    for (const u of cached) {
      const key = u.identifyId;
      const existing = byIdentify.get(key);
      if (!existing || u.lastSeenDate > existing.lastSeenDate) {
        byIdentify.set(key, u);
      }
    }

    const users = [...byIdentify.values()];
    return users;
  }

  private async getActiveUserMetricsDateRange(
    start: string,
    end: string,
    url: string,
  ) {
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
    this.logger.log(
      `Fetched ${users.length} active users for domain ${url} from ${start} to ${end}.`,
    );
    return users;
  }
}
