import { Logger } from '@nestjs/common';
import { Interval, IntervalTree } from 'node-interval-tree';

interface GenericInterval<T> extends Interval {
  item: T;
}

export abstract class TreeCache<T> {
  tree = new IntervalTree<GenericInterval<T>>();
  oldest: T;
  newest: T;

  setCache(items: T[]) {
    const length = items.length;
    if (length === 0) {
      this.tree = new IntervalTree<GenericInterval<T>>();
      return;
    }

    const tree = new IntervalTree<GenericInterval<T>>();
    for (const item of items) {
      const time = this.getDate(item);
      // Use same start and end if it's a point-in-time event
      tree.insert({ low: time, high: time, item });
    }
    this.tree = tree;

    // Verify data is sorted in ascending order by date
    for (let i = 1; i < length; i++) {
      if (this.getDate(items[i]) < this.getDate(items[i - 1])) {
        this.getLogger().error('Cache items must be sorted by date in ascending order!');
      }
    }

    this.oldest = items[0];
    this.newest = items[length - 1];
    if (items.length > 2 && this.getDate(this.oldest) > this.getDate(this.newest)) {
      this.getLogger().error(`Cache items must be sorted by date in ascending order, but oldest is newer than newest! ${this.getDate(this.oldest)} > ${this.getDate(this.newest)}`);
    }
  }

  getCache(start: number, end: number): T[] {
    // Check if range is completely outside cache bounds
    if (start > this.getDate(this.newest)) {
      this.getLogger().log(`Start date param is more recent than the newest lastSeenDate in the cache. ${start} > ${this.getDate(this.newest)}`);
      return [];
    }

    if (end < this.getDate(this.oldest)) {
      this.getLogger().log(`End date param is older than the oldest lastSeenDate in the cache. ${end} < ${this.getDate(this.oldest)}`);
      return [];
    }

    const results = this.tree.search(start, end);
    this.getLogger().log(`Cache query from ${new Date(start).toISOString()} to ${new Date(end).toISOString()} returned ${results.length} items.`);
    return results.map((interval) => interval.item);
  }

  abstract getDate(item: T): number;
  abstract queryCache(start: string, end: string): T[];
  abstract getLogger(): Logger;
}
