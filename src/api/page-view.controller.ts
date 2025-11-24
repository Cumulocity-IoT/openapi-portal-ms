import { Controller, Get, Logger, Query, UseGuards } from '@nestjs/common';
import { PageViewCacheService } from '../cache/page-view-cache.service';
import { PageView } from '../model/gainsight-px.model';
import { TenantGuard } from '../guards/tenant.guard';
@UseGuards(TenantGuard)
@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);
  constructor(private pageViewCacheService: PageViewCacheService) {}

  @Get('/popularDevices')
  async getDeviceCounts(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.verbose(`getDeviceCounts from ${start} to ${end} tenant ${tenantId}`);
    try {
      const pageViews = this.pageViewCacheService.queryCache(start, end, tenantId);
      return this.createPopularDevicesAggregation(pageViews);
    } catch (e) {
      this.logger.error('Error during device count aggregation', e);
      return [];
    }
  }

  private createPopularDevicesAggregation(views: PageView[]) {
    const numberPattern = /\d+/g;
    const counts: Record<string, number> = {};
    for (const view of views) {
      const path = view.hash;
      const matches = path.match(numberPattern);
      if (matches) {
        for (const match of matches) {
          const numberId = '#' + match;
          if (!counts[numberId]) {
            counts[numberId] = 0;
          }
          counts[numberId]++;
        }
      }
    }

    const mapped = Object.entries(counts).map(([path, count]) => ({ path, count }));
    return mapped.sort((a, b) => b.count - a.count);
  }

  @Get('/pageViewCounts')
  async getPageViewCounts(@Query('start') start: string, @Query('end') end: string, @Query('tenantId') tenantId: string) {
    this.logger.verbose(`getPageViewCounts from ${start} to ${end} tenant ${tenantId}`);
    try {
      const pageViews = this.pageViewCacheService.queryCache(start, end, tenantId);
      return this.createrPopularPagesAggregation(pageViews);
    } catch (e) {
      this.logger.error('Error during page view count aggregation', e);
      return [];
    }
  }

  private createrPopularPagesAggregation(views: PageView[]) {
    const counts: Record<string, number> = {};
    for (const view of views) {
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
}
