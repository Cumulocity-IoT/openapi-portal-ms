import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { PageView, PageViewFilter, PageViewSort, PXParams } from './model/gainsight-px.model';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);

  constructor(private api: GainsightPxService) {}
  @Get('/pageViews')
  @UseInterceptors(CacheInterceptor)
  async getPageViews(@Query('start') start?: string, @Query('end') end?: string) {
    let filter = `host==main.dm-zz-q.ioee10-cloud.com;` as PageViewFilter;

    if (start) {
      const date = new Date(start);
      filter += `date>${date.getTime()};`;
    }
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

  private async getPageViewEventsWithPagination(filter: PageViewFilter, sum: PageView[], scrollId?: string): Promise<PageView[]> {
    const params = {
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    } as PXParams<PageViewFilter, PageViewSort>;
    this.logger.log(`Page views request ${params}`);
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
