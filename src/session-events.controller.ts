import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { GainsightPxService } from './service/gainsight-px.service';
import { subDays } from 'date-fns';
import { PXParams, SessionEvent, SessionEventFilter, SessionEventSort } from './model/gainsight-px.model';
import { NormalizedDateCacheInterceptor } from './service/normalized-date-cache-interceptor.service';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller()
export class SessionEventsController {
  private readonly logger = new Logger(SessionEventsController.name);

  constructor(private api: GainsightPxService) {}

  @Get('/sessionEventsLastMonth')
  @UseInterceptors(CacheInterceptor)
  async getSessionEventsLastMonth() {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const filter = `accountId~t2700*;date>${thirtyDaysAgo.getTime()}` as SessionEventFilter;

    this.logger.log(`Fetching session events with filter: ${JSON.stringify(filter)} (${thirtyDaysAgo.toISOString()})`);
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
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));
  }

  @Get('/sessionEventsLastDay')
  @UseInterceptors(CacheInterceptor)
  async getSessionEventsLastDay() {
    const startDate = new Date();
    const twentyFourHoursAgo = subDays(startDate, 1);
    const dateStamp = twentyFourHoursAgo.getTime();

    const filter = `accountId~t2700*;date>${dateStamp}` as SessionEventFilter;
    const allEvents = await this.getSessionEventsWithPagination(filter, []);
    return this.aggregateByMinute(allEvents);
  }

  private async getSessionEventsWithPagination(filter: SessionEventFilter, sum: SessionEvent[], scrollId?: string): Promise<SessionEvent[]> {
    const params = { filter, sort: 'date', pageSize: 1000, scrollId } as PXParams<SessionEventFilter, SessionEventSort>;
    this.logger.log(`Session events request ${JSON.stringify(params)}`);
    const res = await this.api.getSessionEvents(params);

    const events = res.sessionInitializedEvents;
    sum.push(...events);
    if (events.length < 1000) {
      this.logger.log(`Session events - overall count ${sum.length}.`);
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
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));
  }

  @Get('/sessionEvents')
  @UseInterceptors(NormalizedDateCacheInterceptor)
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
    if (allEvents.length) {
      this.logger.log(`Session events - first on ${new Date(allEvents[0].date).toISOString()}, last on ${new Date(allEvents[allEvents.length - 1].date).toISOString()}`);
    }

    return allEvents.map((e) => ({
      time: new Date(e.date).toISOString(),
      eventId: e.eventId,
      identifyId: e.identifyId,
      inferredLocation: e.inferredLocation,
      userType: e.userType,
    }));
  }
}
