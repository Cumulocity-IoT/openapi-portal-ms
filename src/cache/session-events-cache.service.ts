import { GainsightPxService } from "../service/gainsight-px.service";
import {
  PXParams,
  SessionEvent,
  SessionEventFilter,
  SessionEventSort,
} from "../model/gainsight-px.model";
import { Injectable, Logger } from "@nestjs/common";
import { ChronoArrayCache } from "./chrono-array-cache.service";
import {
  CachedSessionEvent,
  mapSessionEventsToCachedSessionEvents,
} from "../model/cache-model";

@Injectable()
export class SessionEventsCacheService extends ChronoArrayCache<CachedSessionEvent> {
  private readonly logger = new Logger(SessionEventsCacheService.name);

  constructor(private api: GainsightPxService) {
    super();
  }

  createOrUpdateCache(
    start: string,
    end: string,
    domain: { id: string; url: string; ttl?: number },
  ): Promise<void> {
    const startDate = this.getStartDate(start, domain.id);
    return this.getSessionEvents(startDate, end, domain.id).then((events) => {
      const cachedEvents = mapSessionEventsToCachedSessionEvents(events);
      this.setCache(cachedEvents, domain.id, domain.ttl);
    });
  }

  queryCache(
    start: string,
    end: string,
    tenantId: string,
  ): CachedSessionEvent[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp, tenantId);
  }

  getDate(item: CachedSessionEvent): number {
    return item.date;
  }
  getLogger(): Logger {
    return this.logger;
  }

  private async getSessionEvents(start: string, end: string, tenantId: string) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();

    const filter =
      `accountId~${tenantId}*;date>${startDate.getTime()};date<${endDate.getTime()}` as SessionEventFilter;
    const allEvents = await this.getSessionEventsWithPagination(filter, []);
    this.logger.log(
      `Fetched ${allEvents.length} session events for tenant ${tenantId} from ${start} to ${end}.`,
    );
    return allEvents;
  }

  private async getSessionEventsWithPagination(
    filter: SessionEventFilter,
    sum: SessionEvent[],
    scrollId?: string,
  ): Promise<SessionEvent[]> {
    const params = {
      filter,
      sort: "date",
      pageSize: 1000,
      scrollId,
    } as PXParams<SessionEventFilter, SessionEventSort>;
    const res = await this.api.getSessionEvents(params);

    const events = res.sessionInitializedEvents;
    sum.push(...events);
    if (events.length < 1000) {
      this.logger.verbose(`Session events - overall count ${sum.length}.`);
      return sum;
    } else {
      return this.getSessionEventsWithPagination(filter, sum, res.scrollId);
    }
  }
}
