import { Injectable } from '@nestjs/common';
import { MyCache } from './cache.model';
import { GainsightPxService } from '../service/gainsight-px.service';
import { CustomEvent, CustomEventFilter, CustomEventSort, PXParams } from '../model/gainsight-px.model';

@Injectable()
export class CustomEventsCacheService implements MyCache<CustomEvent> {
  constructor(private api: GainsightPxService) {}

  private cache: CustomEvent[] = [];

  createCache(start: string, end: string, tenantId: string) {
    this.getCustomEvents(start, end, tenantId).then((events) => (this.cache = events));
  }

  queryCache(start: string, end: string): CustomEvent[] {
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
