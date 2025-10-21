import { Injectable, Logger } from '@nestjs/common';
import { GainsightPxService } from '../service/gainsight-px.service';
import { CustomEvent, CustomEventFilter, CustomEventSort, PXParams } from '../model/gainsight-px.model';
import { TreeCache } from './tree-cache.service';

@Injectable()
export class CustomEventsCacheService extends TreeCache<CustomEvent> {
  private logger: Logger = new Logger(CustomEventsCacheService.name);

  constructor(private api: GainsightPxService) {
    super();
  }

  createCache(start: string, end: string, tenantId: string) {
    return this.getCustomEvents(start, end, tenantId).then((events) => this.setCache(events));
  }

  updateCache(tenantId: string) {
    const start = new Date(this.newest.date).toISOString();
    const end = new Date().toISOString();
    return this.getCustomEvents(start, end, tenantId).then((events) => this.setCache(events));
  }

  getDate(item: CustomEvent): number {
    return item.date;
  }
  getLogger(): Logger {
    return this.logger;
  }

  queryCache(start: string, end: string): CustomEvent[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp);
  }

  private getCustomEvents(start: string, end: string, tenantId: string) {
    let filter = `accountId~${tenantId}*;` as CustomEventFilter; // `accountId~t2700*;eventName==${eventName};` as CustomEventFilter;
    if (start) {
      const date = new Date(start);
      filter += `date>${date.getTime()};`;
    }
    if (end) {
      const date = new Date(end);
      filter += `date<${date.getTime()};`;
    }
    return this.getEventWithPagination(filter, []);
  }

  private async getEventWithPagination(filter: CustomEventFilter, sum: CustomEvent[], scrollId?: string): Promise<CustomEvent[]> {
    const params = { filter, sort: 'date', pageSize: 1000, scrollId } as PXParams<CustomEventFilter, CustomEventSort>;
    const res = await this.api.getCustomEvents(params);
    sum.push(...res.customEvents);
    if (res.customEvents.length < 1000) {
      return sum;
    } else {
      return this.getEventWithPagination(filter, sum, res.scrollId);
    }
  }
}
