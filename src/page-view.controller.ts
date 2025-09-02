import { Controller, Get, Logger, Query } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { PageView, PageViewFilter } from './model/gainsight-px.model';

@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);

  constructor(private api: GainsightPxService) {}
  @Get('/pageViews')
  async getPageViews(@Query('start') start?: string, @Query('end') end?: string) {
    let filter = `host==main.dm-zz-p.ioee10-cloud.com;` as PageViewFilter;

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
    const res = await this.api.getPageViews({
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    });

    const events = res.results;
    sum.push(...events);
    this.logger.log(`Pagination - received ${events.length} poage views - overall count ${sum.length} page views.`);
    if (events.length < 1000) {
      return sum;
    } else {
      return this.getPageViewEventsWithPagination(filter, sum, res.scrollId);
    }
  }
}
