import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { formatDuration, intervalToDuration, subDays } from 'date-fns';
import { GainsightPxService } from './gainsight-px.service';

const EVERY_5_MINUTES = '*/5 * * * *';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  public isTaskRunning = false;
  public lastRun: string;
  private runStart: Date;
  public runDuration: string;
  public runs: { start: string; end: string; duration: string }[] = [];

  constructor(private api: GainsightPxService) {}

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
      // const feature = await this.api.getCustomEventById('7b85f80e-dee0-4e22-8683-d707960c42bd');
      // console.log('Feature:', JSON.stringify(feature));
      
      // const features = await this.api.getFeaturesHierarchy();
      // console.log('Features:', JSON.stringify(features));

     
      // const pageViews = await this.api.getPageViews({ filter: 'host==main.dm-zz-p.ioee10-cloud.com',sort: '-date' });
      // pageViews.results.forEach((event) => { event.date = new Date(event.date).toISOString(); });
      // console.log('Page Views:', pageViews);
      
      // @ts-ignore
      const customEvents = await this.api.getCustomEvents({ filter: 'accountId~t2700*',sort: '-date', pageSize: 100 });
      console.log('Custom Events:', customEvents);

      
      // const customEvents = await this.api.getCustomEvents({ filter: 'accountId~t1564',sort: '-date' });
      // console.log('Custom Events:', customEvents);

      // todo check for signUpDate
      // map feature hierarchy to custom event setip ion google or import/ export custom events
      // users and custom attributes?!
      // how to set up a structure for customers
      // right now we have accounts and one account contains many users
      // how to properly structure that
      // no use case for historical data

      // trigger surveys
      // let nadia know when its fixed
      // const userIds = await this.api.getIdentifyId({ sort: '-date' });
      // console.log('Identify IDs:', JSON.stringify(userIds));
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
