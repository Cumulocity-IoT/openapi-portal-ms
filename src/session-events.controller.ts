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
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = subDays(endDate, 30);
    const filter = `accountId~t2700*;date>${startDate.getTime()}` as SessionEventFilter;

    this.logger.log(`Fetching session events with filter: ${JSON.stringify(filter)} (${startDate.toISOString()})`);
    const allEvents = await this.getSessionEventsWithPagination(filter, []);

    const dateMap: Record<string, number> = {};
    for (let current = new Date(startDate); current <= endDate; current.setHours(current.getHours() + 24)) {
      const date = new Date(current);
      date.setHours(0, 0, 0, 0);
      dateMap[date.toISOString()] = 0;
    }

    return this.aggregateByDay(allEvents, dateMap);
  }

  private aggregateByDay(events: SessionEvent[], counts: Record<string, number>) {
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
    const endDate = new Date();
    const startDate = subDays(endDate, 1);
    const dateStamp = startDate.getTime();

    const filter = `accountId~t2700*;date>${dateStamp}` as SessionEventFilter;
    const allEvents = await this.getSessionEventsWithPagination(filter, []);

    const dateMap: Record<string, number> = {};
    for (let current = new Date(startDate); current <= endDate; current.setHours(current.getHours() + 1)) {
      const date = new Date(current);
      date.setMinutes(0, 0, 0);
      dateMap[date.toISOString()] = 0;
    }
    return this.aggregateByHour(allEvents, dateMap);
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

  private aggregateByHour(events: SessionEvent[], counts: Record<string, number>) {
    events.forEach((event) => {
      const date = new Date(event.date);
      date.setMinutes(0, 0, 0);
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
