import { Logger } from '@nestjs/common';
import { Interval, IntervalTree } from 'node-interval-tree';

interface GenericInterval<T> extends Interval {
  item: T;
}

export abstract class TreeCache<T> {
  cache = new Map<string, IntervalTree<GenericInterval<T>>>();
  bounds = new Map<string, { oldest: T; newest: T }>();

  abstract getDate(item: T): number;
  abstract queryCache(start: string, end: string, tenantId: string): T[];
  abstract getLogger(): Logger;

  getStartDate(start: string, tenantId: string): string {
    if (this.bounds.has(tenantId)) {
      const bounds = this.bounds.get(tenantId);
      return new Date(this.getDate(bounds.newest)).toISOString();
    }
    return start;
  }

  setCache(items: T[], tenantId: string) {
    const length = items?.length ?? 0;
    if (length === 0) {
      this.getLogger().warn('No items!');
      return;
    }

    // Verify data is sorted in ascending order by date
    let isSorted = true;
    for (let i = 1; i < length; i++) {
      if (this.getDate(items[i]) < this.getDate(items[i - 1])) {
        isSorted = false;
        this.getLogger().warn('Cache items must be sorted by date in ascending order!');
        break;
      }
    }

    if (!isSorted) {
      this.getLogger().log(`Sorting things out...`);
      items.sort((a, b) => this.getDate(a) - this.getDate(b));
    }

    this.setBounds(items, length, tenantId);

    this.getLogger().log('Cache items count: ' + length);
    if (!this.cache.has(tenantId)) {
      this.cache.set(tenantId, new IntervalTree<GenericInterval<T>>());
    }
    const tree = this.cache.get(tenantId);
    for (const item of items) {
      const time = this.getDate(item);
      // Use same start and end if it's a point-in-time event
      tree.insert({ low: time, high: time, item });
    }
  }

  private setBounds(items: T[], length: number, tenantId: string) {
    const oldest = items[0];
    const newest = items[length - 1];
    if (!this.bounds.has(tenantId)) {
      this.bounds.set(tenantId, { oldest, newest });
    } else {
      const bounds = this.bounds.get(tenantId);
      // move newest bound on every update
      if (this.getDate(newest) > this.getDate(bounds.newest)) {
        this.bounds.set(tenantId, { oldest: bounds.oldest, newest });
      }
    }
  }

  getCache(start: number, end: number, tenantId: string): T[] {
    // Check if range is completely outside cache bounds
    if (!tenantId || !this.bounds.has(tenantId)) {
      this.getLogger().log('No cache for tenantId ' + tenantId);
      return [];
    }
    const bounds = this.bounds.get(tenantId);
    if (start > this.getDate(bounds.newest)) {
      this.getLogger().log(`Start date param is more recent than the newest lastSeenDate in the cache. ${start} > ${this.getDate(bounds.newest)}`);
      return [];
    }

    if (end < this.getDate(bounds.oldest)) {
      this.getLogger().log(`End date param is older than the oldest lastSeenDate in the cache. ${end} < ${this.getDate(bounds.oldest)}`);
      return [];
    }

    const tree = this.cache.get(tenantId);
    const results = tree.search(start, end);
    this.getLogger().log(`Cache query from ${new Date(start).toISOString()} to ${new Date(end).toISOString()} returned ${results.length} items.`);
    return results.map((interval) => interval.item);
  }
}
