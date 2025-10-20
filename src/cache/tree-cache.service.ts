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
    if (items.length === 0) {
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

    this.oldest = items[0];
    this.newest = items[items.length - 1];
  }

  getCache(start: number, end: number): T[] {
    // Check if range is completely outside cache bounds
    if (start > this.getDate(this.newest)) {
      this.getLogger().log('Start date param is more recent than the newest lastSeenDate in the cache.');
      return [];
    }

    if (end < this.getDate(this.oldest)) {
      this.getLogger().log('End date param is older than the oldest lastSeenDate in the cache.');
      return [];
    }

    const results = this.tree.search(start, end);
    return results.map((interval) => interval.item);
  }

  abstract getDate(item: T): number;
  abstract queryCache(start: string, end: string): T[];
  abstract getLogger(): Logger;
}
