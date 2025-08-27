import { Controller, Get } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { UserUtilityService } from './service/user-utility.service';
import { subDays } from 'date-fns';
import { SessionEvent, SessionEventFilter } from './model/gainsight-px.model';

@Controller()
export class SessionEventsController {
  constructor(private api: GainsightPxService) {}

  @Get('/sessionEventsLastMonth')
  async getSessionEventsDay() {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const filter = `accountId~t2700*;date>${thirtyDaysAgo.getTime()}` as SessionEventFilter;

    const res = await this.api.getSessionEvents({ filter, sort: 'date', pageSize: 1000 });
    const events = res.sessionInitializedEvents;
    if (!events || events.length === 0) {
      return [];
    }

    if (events.length < 1000) {
      return this.aggregateByDay(events);
    }

    const allEvents = await this.getSessionEventsWithPagination(res.scrollId, events, filter);
    return this.aggregateByDay(allEvents);
  }

  private aggregateByDay(events: SessionEvent[]) {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      const date = new Date(event.date);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString();
      if (!counts[key]) {
        counts[key] = 0;
      }
      counts[key]++;
    });

    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  private async getSessionEventsWithPagination(scrollId: string, sum: SessionEvent[], filter: SessionEventFilter) {
    const res = await this.api.getSessionEvents({
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    });

    const events = res.sessionInitializedEvents;
    sum.push(...events);
    if (events.length < 1000) {
      return sum;
    } else {
      return this.getSessionEventsWithPagination(res.scrollId, sum, filter);
    }
  }
  @Get('/sessionEventsLastDay')
  async getSessionEventsToday() {
    const startDate = new Date();
    const twentyFourHoursAgo = subDays(startDate, 1);
    const dateStamp = twentyFourHoursAgo.getTime();

    const filter = `accountId~t2700*;date>${dateStamp}` as SessionEventFilter;
    const res = await this.api.getSessionEvents({ filter: filter, sort: 'date', pageSize: 1000 });
    const events = res.sessionInitializedEvents;
    if (!events || events.length === 0) {
      return [];
    }

    if (events.length < 1000) {
      return this.aggregateByMinute(events);
    }

    const allEvents = await this.getSessionEventsWithPagination(res.scrollId, events, filter);
    return this.aggregateByMinute(allEvents);
  }

  private aggregateByMinute(events: SessionEvent[]) {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      const date = new Date(event.date);
      date.setSeconds(0, 0);
      const key = date.toISOString();
      if (!counts[key]) {
        counts[key] = 0;
      }
      counts[key]++;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }
}
