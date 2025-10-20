import { Injectable, Logger } from '@nestjs/common';
import { PXParams, User, UserFilter, UserSort } from '../model/gainsight-px.model';
import { GainsightPxService } from '../service/gainsight-px.service';
import { TreeCache } from './tree-cache.service';

@Injectable()
export class ActiveUsersCacheService extends TreeCache<User> {
  constructor(private api: GainsightPxService) {
    super();
  }

  private readonly logger = new Logger(ActiveUsersCacheService.name);

  createCache(start: string, end: string, domainName: string) {
    return this.getActiveUserMetricsDateRange(start, end, domainName).then((users) => this.setCache(users));
  }

  getDate(item: User): number {
    return item.lastSeenDate;
  }

  getLogger(): Logger {
    return this.logger;
  }

  queryCache(start: string, end: string): User[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp);
  }

  private async getActiveUserMetricsDateRange(start: string, end: string, domainName: string) {
    let filter = `customAttributes.domainName==${domainName};`;

    const dateFrom = new Date(start);
    filter += `lastSeenDate>${dateFrom.getTime()};`;

    const dateTo = new Date(end);
    filter += `lastSeenDate<${dateTo.getTime()};`;

    const params: PXParams<UserFilter, UserSort> = { filter: filter as UserFilter, sort: 'lastSeenDate', pageSize: 1000 };
    return this.api.getUsers(params).then((res) => res.users);
  }
}
