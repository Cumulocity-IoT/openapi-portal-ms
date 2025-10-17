import { Injectable, Logger } from '@nestjs/common';
import { PageView, PageViewFilter, PageViewSort, PXParams } from '../model/gainsight-px.model';
import { GainsightPxService } from '../service/gainsight-px.service';
import { MyCache } from './cache.model';

@Injectable()
export class PageViewCacheService implements MyCache<PageView> {
  private readonly logger = new Logger(PageViewCacheService.name);
  cache: PageView[] = [];

  constructor(private api: GainsightPxService) {}

  createCache(start: string, end: string, domainName: string) {
    this.getPageViews(start, end, domainName).then((pageViews) => {
      this.cache = pageViews;
    });
  }

  queryCache(start: string, end: string): PageView[] {
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

  private async getPageViews(start: string, end: string, host: string) {
    const dateFrom = new Date(start);
    const dateTo = new Date(end);
    const filter = `host==${host};date>${dateFrom.getTime()};date<${dateTo.getTime()};` as PageViewFilter;
    const allPageViews = await this.getPageViewEventsWithPagination(filter, []);
    if (allPageViews.length) {
      this.logger.log(`Range from ${new Date(allPageViews[0].date).toISOString()} to ${new Date(allPageViews[allPageViews.length - 1].date).toISOString()}`);
    }

    return allPageViews;
  }

  private async getPageViewEventsWithPagination(filter: PageViewFilter, sum: PageView[], scrollId?: string): Promise<PageView[]> {
    const params = {
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    } as PXParams<PageViewFilter, PageViewSort>;
    const res = await this.api.getPageViews(params);

    const events = res.results;
    sum.push(...events);

    if (events.length < 1000) {
      this.logger.log(`Page views - overall count ${sum.length}.`);
      return sum;
    } else {
      return this.getPageViewEventsWithPagination(filter, sum, res.scrollId);
    }
  }
}
