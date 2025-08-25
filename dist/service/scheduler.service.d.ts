import { GainsightPxService } from './gainsight-px.service';
export declare class SchedulerService {
    private api;
    private readonly logger;
    isTaskRunning: boolean;
    lastRun: string;
    private runStart;
    runDuration: string;
    runs: {
        start: string;
        end: string;
        duration: string;
    }[];
    constructor(api: GainsightPxService);
    handleCron(): Promise<void>;
    private updateRuns;
}
