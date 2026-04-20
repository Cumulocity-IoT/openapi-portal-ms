import { Injectable, Logger } from "@nestjs/common";
import { GainsightPxService } from "../service/gainsight-px.service";
import {
  CustomEvent,
  CustomEventFilter,
  CustomEventSort,
  PXParams,
} from "../model/gainsight-px.model";
import { ChronoArrayCache } from "./chrono-array-cache.service";
import {
  CachedEvent,
  mapCustomEventsToCachedEvents,
} from "../model/cache-model";

@Injectable()
export class CustomEventsCacheService extends ChronoArrayCache<CachedEvent> {
  private logger: Logger = new Logger(CustomEventsCacheService.name);

  constructor(private api: GainsightPxService) {
    super();
  }

  createOrUpdateCache(
    start: string,
    end: string,
    domain: { id: string; url: string; ttl?: number },
  ): Promise<void> {
    const startDate = this.getStartDate(start, domain.id);
    return this.getCustomEvents(startDate, end, domain.id).then((events) => {
      const cachedEvents = mapCustomEventsToCachedEvents(events);
      this.setCache(cachedEvents, domain.id, domain.ttl);
    });
  }

  getDate(item: CachedEvent): number {
    return item.date;
  }
  getLogger(): Logger {
    return this.logger;
  }

  queryCache(start: string, end: string, tenantId: string): CachedEvent[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp, tenantId);
  }

  private async getCustomEvents(
    start: string,
    end: string,
    tenantId: string,
  ): Promise<CustomEvent[]> {
    let filter = `accountId~${tenantId}*;` as CustomEventFilter; // `accountId~t1234*;eventName==${eventName};` as CustomEventFilter;
    if (start) {
      const date = new Date(start);
      filter += `date>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `date<${date.getTime()};`;
    }
    const events = await this.getEventWithPagination(filter, []);
    this.logger.log(
      `Fetched ${events.length} custom events for tenant ${tenantId} from ${start} to ${end}.`,
    );
    return events;
  }

  private async getEventWithPagination(
    filter: CustomEventFilter,
    sum: CustomEvent[],
    scrollId?: string,
  ): Promise<CustomEvent[]> {
    const params = {
      filter,
      sort: "date",
      pageSize: 1000,
      scrollId,
    } as PXParams<CustomEventFilter, CustomEventSort>;
    const res = await this.api.getCustomEvents(params);
    sum.push(...res.customEvents);
    if (res.customEvents.length < 1000) {
      return sum;
    } else {
      return this.getEventWithPagination(filter, sum, res.scrollId);
    }
  }
}
