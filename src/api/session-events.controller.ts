import { Controller, Get, Logger, Query, UseInterceptors } from '@nestjs/common';
import { differenceInDays, differenceInHours } from 'date-fns';
import { SessionEvent } from '../model/gainsight-px.model';
import { NormalizedDateCacheInterceptor } from '../service/normalized-date-cache-interceptor.service';
import { SessionEventsCacheService } from '../cache/session-events-cache.service';
@Controller()
export class SessionEventsController {
  private readonly logger = new Logger(SessionEventsController.name);

  constructor(private sessionEventsCacheService: SessionEventsCacheService) {}

  @Get('/sessionEventsAutoAgg')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getSessionsAutoAgg(@Query('start') start: string, @Query('end') end?: string) {
    const allEvents = await this.sessionEventsCacheService.queryCache(start, end);
    const aggregated = this.aggregateByTimeframe(allEvents, new Date(start), new Date(end));
    return aggregated;
  }

  private aggregateByTimeframe(events: SessionEvent[], startDate: Date, endDate: Date) {
    const timeframe = this.detectTimeframe(startDate, endDate);
    const counts = this.prepopulateDates(startDate, endDate, timeframe);
    events.forEach((event) => {
      const date = new Date(event.date);
      if (timeframe === 'MINUTE') {
        date.setSeconds(0, 0);
      } else if (timeframe === 'HOUR') {
        date.setMinutes(0, 0, 0);
      } else if (timeframe === 'DAY') {
        date.setHours(0, 0, 0, 0);
      }
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

  private detectTimeframe(startDate: Date, endDate: Date) {
    const diffInHours = differenceInHours(endDate, startDate);
    const diffInDays = differenceInDays(endDate, startDate);

    if (diffInHours <= 1) {
      return 'MINUTE';
    } else if (diffInDays <= 1) {
      return 'HOUR';
    } else {
      return 'DAY';
    }
  }

  private prepopulateDates(startDate: Date, endDate: Date, timeframe: 'MINUTE' | 'HOUR' | 'DAY'): Record<string, number> {
    const dateMap: Record<string, number> = {};
    if (timeframe === 'DAY') {
      for (let current = new Date(startDate); current <= endDate; current.setHours(current.getHours() + 24)) {
        const date = new Date(current);
        date.setHours(0, 0, 0, 0);
        dateMap[date.toISOString()] = 0;
      }
    } else if (timeframe === 'HOUR') {
      for (let current = new Date(startDate); current <= endDate; current.setHours(current.getHours() + 1)) {
        const date = new Date(current);
        date.setMinutes(0, 0, 0);
        dateMap[date.toISOString()] = 0;
      }
    } else if (timeframe === 'MINUTE') {
      for (let current = new Date(startDate); current <= endDate; current.setHours(current.getMinutes() + 1)) {
        const date = new Date(current);
        date.setSeconds(0, 0);
        dateMap[date.toISOString()] = 0;
      }
    }
    return dateMap;
  }

  @Get('/sessionEvents')
  @UseInterceptors(NormalizedDateCacheInterceptor)
  async getSessions(@Query('start') start?: string, @Query('end') end?: string) {
    const allEvents = await this.sessionEventsCacheService.queryCache(start, end);
    if (allEvents.length) {
      this.logger.log(`Range from ${new Date(allEvents[0].date).toISOString()} to ${new Date(allEvents[allEvents.length - 1].date).toISOString()}`);
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
