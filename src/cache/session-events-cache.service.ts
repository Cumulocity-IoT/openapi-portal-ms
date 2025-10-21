import { GainsightPxService } from '../service/gainsight-px.service';
import { PXParams, SessionEvent, SessionEventFilter, SessionEventSort } from '../model/gainsight-px.model';
import { Injectable, Logger } from '@nestjs/common';
import { TreeCache } from './tree-cache.service';

@Injectable()
export class SessionEventsCacheService extends TreeCache<SessionEvent> {
  private readonly logger = new Logger(SessionEventsCacheService.name);

  constructor(private api: GainsightPxService) {
    super();
  }

  createCache(start: string, end: string, tenantId: string) {
    return this.getSessionEvents(start, end, tenantId).then((events) => this.setCache(events));
  }

  updateCache(tenantId: string) {
    const start = new Date(this.newest.date).toISOString();
    const end = new Date().toISOString();
    return this.getSessionEvents(start, end, tenantId).then((events) => this.setCache(events));
  }

  queryCache(start: string, end: string): SessionEvent[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp);
  }

  getDate(item: SessionEvent): number {
    return item.date;
  }
  getLogger(): Logger {
    return this.logger;
  }

  private async getSessionEvents(start: string, end: string, tenantId: string) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();

    const filter = `accountId~${tenantId}*;date>${startDate.getTime()};date<${endDate.getTime()}` as SessionEventFilter;
    const allEvents = await this.getSessionEventsWithPagination(filter, []);
    return allEvents;
  }

  private async getSessionEventsWithPagination(filter: SessionEventFilter, sum: SessionEvent[], scrollId?: string): Promise<SessionEvent[]> {
    const params = { filter, sort: 'date', pageSize: 1000, scrollId } as PXParams<SessionEventFilter, SessionEventSort>;
    const res = await this.api.getSessionEvents(params);

    const events = res.sessionInitializedEvents;
    sum.push(...events);
    if (events.length < 1000) {
      this.logger.log(`Session events - overall count ${sum.length}.`);
      return sum;
    } else {
      return this.getSessionEventsWithPagination(filter, sum, res.scrollId);
    }
  }
}
