import { Injectable, Logger } from "@nestjs/common";
import { GainsightPxService } from "../service/gainsight-px.service";
import {
  CustomEvent,
  CustomEventFilter,
  CustomEventSort,
  PXParams,
  ReducedEvent,
} from "../model/gainsight-px.model";
import { TreeCache } from "./tree-cache.service";

@Injectable()
export class CustomEventsCacheService extends TreeCache<ReducedEvent> {
  private logger: Logger = new Logger(CustomEventsCacheService.name);

  constructor(private api: GainsightPxService) {
    super();
  }

  createOrUpdateCache(
    start: string,
    end: string,
    domain: { id: string; url: string },
  ): Promise<void> {
    const startDate = this.getStartDate(start, domain.id);
    return this.getCustomEvents(startDate, end, domain.id).then((events) => {
      const reduced: ReducedEvent[] = events.map((e) => ({
        name: e.eventName,
        data: e.attributes,
        date: e.date,
        userId: e.identifyId,
        sessionId: e.sessionId,
      }));
      this.setCache(reduced, domain.id);
    });
  }

  getDate(item: ReducedEvent): number {
    return item.date;
  }
  getLogger(): Logger {
    return this.logger;
  }

  queryCache(start: string, end: string, tenantId: string): ReducedEvent[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp, tenantId);
  }

  private async getCustomEvents(
    start: string,
    end: string,
    tenantId: string,
  ): Promise<CustomEvent[]> {
    let filter = `accountId~${tenantId}*;` as CustomEventFilter; // `accountId~t2700*;eventName==${eventName};` as CustomEventFilter;
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
