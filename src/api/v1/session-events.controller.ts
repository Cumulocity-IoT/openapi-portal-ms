import { Controller, Get, Logger, Query, UseGuards } from "@nestjs/common";
import {
  addDays,
  addHours,
  addMinutes,
  differenceInDays,
  differenceInHours,
  startOfDay,
  startOfHour,
  startOfMinute,
} from "date-fns";
import { SessionEventsCacheService } from "../../cache/session-events-cache.service";
import { TenantGuard } from "../../guards/tenant.guard";
import { CachedSessionEvent } from "../../model/cache-model";
@UseGuards(TenantGuard)
@Controller()
export class SessionEventsController {
  private readonly logger = new Logger(SessionEventsController.name);

  constructor(private sessionEventsCacheService: SessionEventsCacheService) {}

  @Get("/sessionEventsAutoAgg")
  async getSessionsAutoAgg(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `getSessionsAutoAgg from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const allEvents = this.sessionEventsCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      const aggregated = this.aggregateByTimeframe(
        allEvents,
        new Date(start),
        new Date(end),
      );
      return aggregated;
    } catch (e) {
      this.logger.error("Error during aggregation", e);
      return [];
    }
  }

  private aggregateByTimeframe(
    events: CachedSessionEvent[],
    startDate: Date,
    endDate: Date,
  ) {
    const timeframe = this.detectTimeframe(startDate, endDate);
    const counts = this.prepopulateDates(startDate, endDate, timeframe);
    for (const event of events) {
      const date = new Date(event.date);
      if (timeframe === "MINUTE") {
        date.setSeconds(0, 0);
      } else if (timeframe === "HOUR") {
        date.setMinutes(0, 0, 0);
      } else if (timeframe === "DAY") {
        date.setHours(0, 0, 0, 0);
      }
      const key = date.toISOString();
      if (!counts[key]) {
        counts[key] = 0;
      }
      counts[key]++;
    }

    return Object.entries(counts)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));
  }

  private detectTimeframe(startDate: Date, endDate: Date) {
    const diffInHours = differenceInHours(endDate, startDate);
    const diffInDays = differenceInDays(endDate, startDate);

    if (diffInHours <= 1) {
      return "MINUTE";
    } else if (diffInDays <= 1) {
      return "HOUR";
    } else {
      return "DAY";
    }
  }

  private prepopulateDates(
    startDate: Date,
    endDate: Date,
    timeframe: "MINUTE" | "HOUR" | "DAY",
  ): Record<string, number> {
    const dateMap: Record<string, number> = {};
    if (startDate > endDate) return dateMap;

    if (timeframe === "DAY") {
      let current = startOfDay(startDate);
      const last = startOfDay(endDate);
      while (current <= last) {
        dateMap[current.toISOString()] = 0;
        current = addDays(current, 1);
      }
    } else if (timeframe === "HOUR") {
      let current = startOfHour(startDate);
      const last = startOfHour(endDate);
      while (current <= last) {
        dateMap[current.toISOString()] = 0;
        current = addHours(current, 1);
      }
    } else if (timeframe === "MINUTE") {
      let current = startOfMinute(startDate);
      const last = startOfMinute(endDate);
      while (current <= last) {
        dateMap[current.toISOString()] = 0;
        current = addMinutes(current, 1);
      }
    }
    return dateMap;
  }

  @Get("/sessionEvents")
  async getSessions(
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("tenantId") tenantId: string,
  ) {
    this.logger.verbose(
      `getSessions from ${start} to ${end} tenant ${tenantId}`,
    );
    try {
      const allEvents = this.sessionEventsCacheService.queryCache(
        start,
        end,
        tenantId,
      );
      if (allEvents.length) {
        this.logger.verbose(
          `Range from ${new Date(allEvents[0].date).toISOString()} to ${new Date(allEvents[allEvents.length - 1].date).toISOString()}`,
        );
      }

      return allEvents.map((e) => ({
        time: new Date(e.date).toISOString(),
        eventId: e.id,
        identifyId: e.iId,
        inferredLocation: e.location,
        userType: e.userType,
      }));
    } catch (e) {
      this.logger.error("Error during session events retrieval", e);
      return [];
    }
  }
}
