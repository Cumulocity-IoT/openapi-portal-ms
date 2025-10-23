// src/api/session-events.controller.test.ts
import { subDays } from 'date-fns';
import { SessionEventsController } from './session-events.controller';

describe('SessionEventsController.aggregateByTimeframe', () => {
  it('prepopulates DAILY buckets for 90 days with zero counts when events array is empty', () => {
    const mockCacheService = {} as any;
    const controller = new SessionEventsController(mockCacheService);

    const endDate = new Date();
    const startDate = subDays(endDate, 90);

    const result = (controller as any).aggregateByTimeframe([], startDate, endDate);

    // helper to compute inclusive days between normalized start/end at local midnight
    const normalizeToMidnight = (d: Date) => {
      const n = new Date(d);
      n.setHours(0, 0, 0, 0);
      return n;
    };

    const normStart = normalizeToMidnight(startDate);
    const normEnd = normalizeToMidnight(endDate);

    let expectedDays = 0;
    for (let cur = new Date(normStart); cur <= normEnd; cur.setDate(cur.getDate() + 1)) {
      expectedDays++;
    }

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(expectedDays);
    result.forEach((item: any) => {
      expect(item.count).toBe(0);
    });

    expect(result[0].time).toBe(normStart.toISOString());
    expect(result[result.length - 1].time).toBe(normEnd.toISOString());
  });
});