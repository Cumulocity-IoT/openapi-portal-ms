import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { formatDuration, intervalToDuration, subDays } from 'date-fns';
import { ActiveUsersCacheService } from '../cache/active-users-cache.service';
import { CustomEventsCacheService } from '../cache/custom-events-cache.service';
import { PageViewCacheService } from '../cache/page-view-cache.service';
import { SessionEventsCacheService } from '../cache/session-events-cache.service';
import { ConfigurationService } from './configuration.service';

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
    private sessionEventsCacheService: SessionEventsCacheService,
    private configService: ConfigurationService
  ) {}

  @Cron(EVERY_10_MINUTES)
  handleCron() {
    if (this.isTaskRunning) {
      this.logger.warn('Task is already running. Skipping this execution.');
      return;
    }

    this.isTaskRunning = true;
    this.runStart = new Date();
    delete this.runDuration;
    this.logger.log('Starting the scheduled task.');

    const timeRange = { start: subDays(new Date(), 90).toISOString(), end: new Date().toISOString() };

    this.configService
      .getAllDomains()
      .then((domains) => {
        const promises: Promise<void>[] = [];
        for (const domain of domains) {
          this.logger.log('Starting caching for domain: ' + domain.url + ' (tenantId: ' + domain.id + ')');
          promises.push(
            ...[
              this.activeUserCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain).catch((error) => this.logger.error('Error during cache creation for active users', error)),
              this.customEventsCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain).catch((error) => this.logger.error('Error during cache creation for custom events', error)),
              this.pageViewCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain).catch((error) => this.logger.error('Error during cache creation for page views', error)),
              this.sessionEventsCacheService.createOrUpdateCache(timeRange.start, timeRange.end, domain).catch((error) => this.logger.error('Error during cache creation for session events', error)),
            ]
          );
        }
        return Promise.all(promises);
      })
      .finally(() => {
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
      });
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
