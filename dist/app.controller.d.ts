import { SchedulerService } from './service/scheduler.service';
import { GainsightPxService } from './service/gainsight-px.service';
export declare class AppController {
    private scheduler;
    private api;
    constructor(scheduler: SchedulerService, api: GainsightPxService);
    getRuns(): {
        start: string;
        end: string;
        duration: string;
    }[];
    getLastRun(): {
        lastRun: string;
        duration: string;
    };
    checkHealth(): {
        status: string;
    };
    getActiveUsers(): Promise<void[]>;
    getCustomEvents(): Promise<import("./model/gainsight-px.model").CustomEventsResponse>;
}
