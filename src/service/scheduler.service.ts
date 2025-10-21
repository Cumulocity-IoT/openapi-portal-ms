import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { formatDuration, intervalToDuration, subDays } from 'date-fns';
import { ActiveUsersCacheService } from '../cache/active-users-cache.service';
import { CustomEventsCacheService } from '../cache/custom-events-cache.service';
import { TENANT } from '../app.model';
import { PageViewCacheService } from '../cache/page-view-cache.service';
import { SessionEventsCacheService } from '../cache/session-events-cache.service';

const EVERY_10_MINUTES = '*/10 * * * *';
// const EVERY_HOUR = '0 * * * *';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  public isTaskRunning = false;
  public lastRun?: string;
  private runStart: Date;
  public runDuration?: string;
  public runs: { start: string; end: string; duration: string }[] = [];

  constructor(
    private activeUserCacheService: ActiveUsersCacheService,
    private customEventsCacheService: CustomEventsCacheService,
    private pageViewCacheService: PageViewCacheService,
    private sessionEventsCacheService: SessionEventsCacheService
  ) {}

  @Cron(EVERY_10_MINUTES)
  async handleCron() {
    if (this.isTaskRunning) {
      this.logger.warn('Task is already running. Skipping this execution.');
      return;
    }

    this.isTaskRunning = true;
    this.runStart = new Date();
    delete this.runDuration;
    this.logger.log('Starting the scheduled task.');

    try {
      const timeRange = { start: subDays(new Date(), 90).toISOString(), end: new Date().toISOString() };
      const promises = [
        this.activeUserCacheService.createOrUpdateCache(timeRange.start, timeRange.end, TENANT.DOMAIN),
        this.customEventsCacheService.createOrUpdateCache(timeRange.start, timeRange.end, TENANT.ID),
        this.pageViewCacheService.createOrUpdateCache(timeRange.start, timeRange.end, TENANT.DOMAIN),
        this.sessionEventsCacheService.createOrUpdateCache(timeRange.start, timeRange.end, TENANT.ID),
      ];
      await Promise.all(promises);
    } catch (error) {
      this.logger.error('Error during task execution', error);
    } finally {
      const runEnd = new Date();
      this.lastRun = runEnd.toISOString();
      const duration = intervalToDuration({
        start: this.runStart,
        end: runEnd,
      });

      this.runDuration = formatDuration(duration);
      this.updateRuns();
      this.logger.log('Task execution completed. Duration: ' + this.runDuration);
      this.isTaskRunning = false;
    }
  }

  getDuration() {
    if (this.isTaskRunning) {
      const now = new Date();
      const duration = intervalToDuration({
        start: this.runStart,
        end: now,
      });
      return formatDuration(duration);
    }
    return this.runDuration;
  }

  private updateRuns() {
    this.runs.push({
      start: this.runStart.toISOString(),
      end: this.lastRun,
      duration: this.runDuration,
    });
    if (this.runs.length > 1000) {
      this.runs.shift();
    }
  }
}
