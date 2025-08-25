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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const scheduler_service_1 = require("./service/scheduler.service");
const gainsight_px_service_1 = require("./service/gainsight-px.service");
const date_fns_1 = require("date-fns");
let AppController = class AppController {
    constructor(scheduler, api) {
        this.scheduler = scheduler;
        this.api = api;
    }
    getRuns() {
        return this.scheduler.runs;
    }
    getLastRun() {
        return {
            lastRun: this.scheduler.lastRun,
            duration: this.scheduler.runDuration,
        };
    }
    checkHealth() {
        return {
            status: 'UP',
        };
    }
    async getActiveUsers() {
        const users = await this.api.getUsers({
            filter: 'customAttributes.domainName==main.dm-zz-q.ioee10-cloud.com',
            sort: '-lastSeenDate',
            pageSize: 1000,
        });
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = (0, date_fns_1.subDays)(startDate, 30);
        const last30Days = users.users.filter((user) => new Date(user.lastSeenDate) >= thirtyDaysAgo);
        const anonymized = this.api.removePrivacyData(last30Days);
        return anonymized;
    }
    async getCustomEvents() {
        const customEvents = await this.api.getCustomEvents({ filter: 'accountId~t2700*', sort: '-date', pageSize: 100 });
        return customEvents;
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('/runs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getRuns", null);
__decorate([
    (0, common_1.Get)('/lastRun'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getLastRun", null);
__decorate([
    (0, common_1.Get)('/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "checkHealth", null);
__decorate([
    (0, common_1.Get)('/activeUsers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getActiveUsers", null);
__decorate([
    (0, common_1.Get)('/customEvents'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getCustomEvents", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [scheduler_service_1.SchedulerService,
        gainsight_px_service_1.GainsightPxService])
], AppController);
//# sourceMappingURL=app.controller.js.map