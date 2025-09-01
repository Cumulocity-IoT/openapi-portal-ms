import { Controller, Get, Logger, Query } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { subDays } from 'date-fns';
import { SessionEvent, SessionEventFilter } from './model/gainsight-px.model';

@Controller()
export class SessionEventsController {
  private readonly logger = new Logger(SessionEventsController.name);

  constructor(private api: GainsightPxService) {}

  @Get('/sessionEventsLastMonth')
  async getSessionEventsLastMonth() {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const filter = `accountId~t2700*;date>${thirtyDaysAgo.getTime()}` as SessionEventFilter;

    this.logger.log(`Fetching session events with filter: ${filter} (${thirtyDaysAgo.toISOString()})`);
    const allEvents = await this.getSessionEventsWithPagination(filter, []);
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

  @Get('/sessionEventsLastDay')
  async getSessionEventsLastDay() {
    const startDate = new Date();
    const twentyFourHoursAgo = subDays(startDate, 1);
    const dateStamp = twentyFourHoursAgo.getTime();

    const filter = `accountId~t2700*;date>${dateStamp}` as SessionEventFilter;
    const allEvents = await this.getSessionEventsWithPagination(filter, []);
    return this.aggregateByMinute(allEvents);
  }

  private async getSessionEventsWithPagination(filter: SessionEventFilter, sum: SessionEvent[], scrollId?: string) {
    const res = await this.api.getSessionEvents({
      filter,
      sort: 'date',
      pageSize: 1000,
      scrollId,
    });

    const events = res.sessionInitializedEvents;
    sum.push(...events);
    this.logger.log(`Pagination - received ${events.length} events - overall count ${sum.length} events.`);
    if (events.length < 1000) {
      return sum;
    } else {
      return this.getSessionEventsWithPagination(filter, sum, res.scrollId);
    }
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

  @Get('/sessionEvents')
    async getCustomEvents(@Query('start') start?: string, @Query('end') end?: string) {
      let filter = `accountId~t2700*;` as SessionEventFilter;
      if (start) {
        const date = new Date(start);
        filter += `date>${date.getTime()};`;
      }
      if (end) {
        const date = new Date(end);
        filter += `date<${date.getTime()};`;
      }
  
      const allEvents = await this.getSessionEventsWithPagination(filter, []);
      return allEvents;
    }
}
