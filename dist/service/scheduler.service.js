"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const date_fns_1 = require("date-fns");
const gainsight_px_service_1 = require("./gainsight-px.service");
const EVERY_5_MINUTES = '*/5 * * * *';
let SchedulerService = SchedulerService_1 = class SchedulerService {
    constructor(api) {
        this.api = api;
        this.logger = new common_1.Logger(SchedulerService_1.name);
        this.isTaskRunning = false;
        this.runs = [];
    }
    async handleCron() {
        if (this.isTaskRunning) {
            this.logger.warn('Task is already running. Skipping this execution.');
            return;
        }
        this.isTaskRunning = true;
        this.runStart = new Date();
        this.logger.log('Starting the scheduled task.');
        try {
            const customEvents = await this.api.getCustomEvents({ filter: 'accountId~t2700*', sort: '-date', pageSize: 100 });
            console.log('Custom Events:', customEvents);
        }
        catch (error) {
            this.logger.error('Error during task execution', error);
        }
        finally {
            const runEnd = new Date();
            this.lastRun = runEnd.toISOString();
            const duration = (0, date_fns_1.intervalToDuration)({
                start: this.runStart,
                end: runEnd,
            });
            this.runDuration = (0, date_fns_1.formatDuration)(duration);
            this.runs.push();
            this.updateRuns();
            this.logger.log('Task execution completed. Duration: ' + this.runDuration);
            this.isTaskRunning = false;
        }
    }
    updateRuns() {
        this.runs.push({
            start: this.runStart.toISOString(),
            end: this.lastRun,
            duration: this.runDuration,
        });
        if (this.runs.length > 1000) {
            this.runs.shift();
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleCron", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gainsight_px_service_1.GainsightPxService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map