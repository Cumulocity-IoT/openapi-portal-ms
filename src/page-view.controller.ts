import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { PageView, PageViewFilter, PageViewSort, PXParams } from './model/gainsight-px.model';
import { NormalizedDateCacheInterceptor } from './service/normalized-date-cache-interceptor.service';

@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);

  constructor(private api: GainsightPxService) {}
  @Get('/pageViews')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getPageViews(@Query('start') start: string, @Query('end') end?: string) {
    const date = new Date(start);
    let filter = `host==main.dm-zz-q.ioee10-cloud.com;date>${date.getTime()};` as PageViewFilter;

    if (end) {
      const date = new Date(end);
      filter += `date<${date.getTime()};`;
    }

    const allPageViews = await this.getPageViewEventsWithPagination(filter, []);
    if (allPageViews.length) {
      this.logger.log(`Page views - first on ${new Date(allPageViews[0].date).toISOString()}, last on ${new Date(allPageViews[allPageViews.length - 1].date).toISOString()}`);
    }
    return allPageViews;
  }

  @Get('/popularDevices')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getDeviceCounts(@Query('start') start: string, @Query('end') end?: string) {
    const pageViews = await this.getPageViews(start, end);
    const numberPattern = /\d+/g;
    const counts: Record<string, number> = {};
    for (const view of pageViews) {
      const path = view.hash;
      const matches = path.match(numberPattern);
      if (matches) {
        for (const match of matches) {
          if (!counts[match]) {
            counts[match] = 0;
          }
          counts[match]++;
        }
      }
    }

    const mapped = Object.entries(counts).map(([path, count]) => ({ path, count }));
    return mapped.sort((a, b) => b.count - a.count);
  }

  @Get('/pageViewCounts')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getPageViewCounts(@Query('start') start: string, @Query('end') end?: string) {
    const pageViews = await this.getPageViews(start, end);
    const counts: Record<string, number> = {};
    for (const view of pageViews) {
      const path = view.hash;
      const maskeUrl = path.replace(/\d+/g, '*');
      if (!maskeUrl) {
        continue;
      }
      if (!counts[maskeUrl]) {
        counts[maskeUrl] = 0;
      }
      counts[maskeUrl]++;
    }

    const mapped = Object.entries(counts).map(([path, count]) => ({ path, count }));
    return mapped.sort((a, b) => b.count - a.count);
  }

  private async getPageViewEventsWithPagination(filter: PageViewFilter, sum: PageView[], scrollId?: string): Promise<PageView[]> {
    const params = {
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    } as PXParams<PageViewFilter, PageViewSort>;
    this.logger.log(`Page views request ${JSON.stringify(params)}`);
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
