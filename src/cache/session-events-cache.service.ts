import { GainsightPxService } from '../service/gainsight-px.service';
import { MyCache } from './cache.model';
import { PXParams, SessionEvent, SessionEventFilter, SessionEventSort } from '../model/gainsight-px.model';
import { Logger } from '@nestjs/common';

export class SessionEventsCacheService implements MyCache<SessionEvent> {
  private readonly logger = new Logger(SessionEventsCacheService.name);

  constructor(private api: GainsightPxService) {}

  private cache: SessionEvent[] = [];

  createCache(start: string, end: string, tenantId: string) {
    this.getSessionEvents(start, end, tenantId).then((events) => (this.cache = events));
  }

  queryCache(start: string, end: string): SessionEvent[] {
    // Early return if cache is empty or completely out of range
    if (this.cache.length === 0) return [];
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();

    // Check if range is completely outside cache bounds
    if (startStamp > this.cache[this.cache.length - 1].date || endStamp < this.cache[0].date) {
      return [];
    }

    const binarySearch = (time: number): number => {
      let left = 0;
      let right = this.cache.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (this.cache[mid].date === time) return mid;
        if (this.cache[mid].date < time) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      return left;
    };

    const startIndex = binarySearch(startStamp);
    if (startIndex >= this.cache.length) return [];

    const endIndex = binarySearch(endStamp);
    return this.cache.slice(startIndex, endIndex);
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
