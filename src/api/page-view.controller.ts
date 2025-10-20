import { Controller, Get, Logger, Query } from '@nestjs/common';
import { PageViewCacheService } from '../cache/page-view-cache.service';

@Controller()
export class PageViewController {
  private readonly logger = new Logger(PageViewController.name);
  constructor(private pageViewCacheService: PageViewCacheService) {}

  @Get('/popularDevices')
  async getDeviceCounts(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`getDeviceCounts from ${start} to ${end}`);
    const pageViews = this.pageViewCacheService.queryCache(start, end);
    const numberPattern = /\d+/g;
    const counts: Record<string, number> = {};
    for (const view of pageViews) {
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
  async getPageViewCounts(@Query('start') start: string, @Query('end') end: string) {
    this.logger.log(`getPageViewCounts from ${start} to ${end}`);
    const pageViews = await this.pageViewCacheService.queryCache(start, end);
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
}
