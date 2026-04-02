import { Injectable, Logger } from "@nestjs/common";
import {
  PageView,
  PageViewFilter,
  PageViewSort,
  PXParams,
} from "../model/gainsight-px.model";
import { GainsightPxService } from "../service/gainsight-px.service";
import { TreeCache } from "./tree-cache.service";

@Injectable()
export class PageViewCacheService extends TreeCache<PageView> {
  private readonly logger = new Logger(PageViewCacheService.name);

  constructor(private api: GainsightPxService) {
    super();
  }

  createOrUpdateCache(
    start: string,
    end: string,
    domain: { id: string; url: string },
  ): Promise<void> {
    const startDate = this.getStartDate(start, domain.id);
    return this.getPageViews(startDate, end, domain.url).then((pageViews) =>
      this.setCache(pageViews, domain.id),
    );
  }

  queryCache(start: string, end: string, tenantId: string): PageView[] {
    const startStamp = new Date(start).getTime();
    const endStamp = new Date(end).getTime();
    return this.getCache(startStamp, endStamp, tenantId);
  }

  getDate(item: PageView): number {
    return item.date;
  }
  getLogger(): Logger {
    return this.logger;
  }

  private async getPageViews(start: string, end: string, host: string) {
    const dateFrom = new Date(start);
    const dateTo = new Date(end);
    const filter =
      `host==${host};date>${dateFrom.getTime()};date<${dateTo.getTime()};` as PageViewFilter;
    const allPageViews = await this.getPageViewEventsWithPagination(filter, []);
    this.logger.log(
      `Fetched ${allPageViews.length} page views for host ${host} from ${start} to ${end}.`,
    );

    return allPageViews;
  }

  private async getPageViewEventsWithPagination(
    filter: PageViewFilter,
    sum: PageView[],
    scrollId?: string,
  ): Promise<PageView[]> {
    const params = {
      filter,
      sort: "date",
      pageSize: 1000,
      scrollId,
    } as PXParams<PageViewFilter, PageViewSort>;
    const res = await this.api.getPageViews(params);

    const events = res.results;
    sum.push(...events);

    if (events.length < 1000) {
      this.logger.verbose(`Page views - overall count ${sum.length}.`);
      return sum;
    } else {
      return this.getPageViewEventsWithPagination(filter, sum, res.scrollId);
    }
  }
}
