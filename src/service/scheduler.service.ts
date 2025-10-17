import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { formatDuration, intervalToDuration, subDays } from 'date-fns';
import { GainsightPxService } from './gainsight-px.service';
import { ActiveUsersCacheService } from '../cache/active-users-cache.service';

const EVERY_5_MINUTES = '*/5 * * * *';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  public isTaskRunning = false;
  public lastRun: string;
  private runStart: Date;
  public runDuration: string;
  public runs: { start: string; end: string; duration: string }[] = [];

  constructor(
    private api: GainsightPxService,
    private activeUserService: ActiveUsersCacheService
  ) {}

  @Cron(EVERY_5_MINUTES)
  async handleCron() {
    if (this.isTaskRunning) {
      this.logger.warn('Task is already running. Skipping this execution.');
      return;
    }

    this.isTaskRunning = true;
    this.runStart = new Date();
    this.logger.log('Starting the scheduled task.');

    try {
      const timeRange =  { start: subDays(new Date(), 1).toISOString(), end: new Date().toISOString() };
      this.activeUserService.createCache(timeRange.start, timeRange.end, 'main.dm-zz-q.ioee10-cloud.com');
      this.activeUserService.createCache(timeRange.start, timeRange.end, 'main.dm-zz-d.ioee10-cloud.com');
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
      this.runs.push();
      this.updateRuns();
      this.logger.log('Task execution completed. Duration: ' + this.runDuration);
      this.isTaskRunning = false;
    }
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
