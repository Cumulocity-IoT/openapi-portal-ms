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
var CalculationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculationService = void 0;
const common_1 = require("@nestjs/common");
const measurement_aggregation_util_1 = require("../util/measurement-aggregation-util");
const measurement_fetch_util_1 = require("../util/measurement-fetch-util");
const lodash_1 = require("lodash");
const api_service_1 = require("./api.service");
let CalculationService = CalculationService_1 = class CalculationService {
    constructor(api) {
        this.api = api;
        this.logger = new common_1.Logger(CalculationService_1.name);
    }
    async calculateLatestValue(device, eligibleDatapoints) {
        const update = { id: device.id, koc_LatestMeasurements: {} };
        let latestDate = '';
        for (const datapoint of eligibleDatapoints) {
            this.logger.log(`Latest measurement for ${datapoint}`);
            const latest = await this.api.fetchLatestMeasurement(datapoint, device.id);
            if (latest) {
                const m = (0, lodash_1.get)(latest, datapoint);
                const data = {
                    ...m,
                    time: latest.time,
                };
                (0, lodash_1.set)(update, `koc_LatestMeasurements.${datapoint}`, data);
                this.logger.log(`=> Latest ${m.value} ${m.unit ?? '-'}`);
                if (data.time > latestDate) {
                    latestDate = data.time;
                }
            }
            else {
                this.logger.log(`=> No measurement found.`);
            }
        }
        if (Object.keys(update.koc_LatestMeasurements).length > 0) {
            this.logger.log(`Updating device ${device.name} with latest values...`);
            (0, lodash_1.set)(update.koc_LatestMeasurements, 'lastUpdate', new Date().toISOString());
            (0, lodash_1.set)(update.koc_LatestMeasurements, 'mostRecentTime', latestDate);
            this.api.updateDevice(device, update);
        }
    }
    async calculateAggregates(device, eligibleDatapoints) {
        const update = { id: device.id, koc_AggregatedMeasurements: {} };
        for (const datapoint of eligibleDatapoints) {
            this.logger.log(`Calculate Ø 24 hours for ${datapoint}`);
            const measurementsForLast24Hours = await this.api.fetchMeasurements((0, measurement_fetch_util_1.datesForLast24Hours)(), device.id, datapoint);
            if (measurementsForLast24Hours.length) {
                const maxAverage24Hours = (0, measurement_aggregation_util_1.calculateAverageMaxForLast24Hours)(measurementsForLast24Hours, datapoint);
                if (!(0, lodash_1.isNil)(maxAverage24Hours.value) &&
                    !isNaN(maxAverage24Hours.value)) {
                    (0, lodash_1.set)(update, `koc_AggregatedMeasurements.${datapoint}_24hours_max_avg`, maxAverage24Hours);
                    this.logger.log(`=> Max average ${maxAverage24Hours.value}`);
                }
                const percentile24Hours = (0, measurement_aggregation_util_1.calculatePercentile)(measurementsForLast24Hours, datapoint);
                if (!(0, lodash_1.isNil)(percentile24Hours.value) &&
                    !isNaN(percentile24Hours.value)) {
                    (0, lodash_1.set)(update, `koc_AggregatedMeasurements.${datapoint}_24hours_90p`, percentile24Hours);
                    this.logger.log(`=> 90th percentile ${percentile24Hours.value}`);
                }
            }
            else {
                this.logger.log(`=> No measurements found.`);
            }
            this.logger.log(`Calculate Ø 7 days for ${datapoint} of device ${device.name}`);
            const measurementsForLast7Days = await this.api.fetchMeasurements((0, measurement_fetch_util_1.datesForLast7Days)(), device.id, datapoint);
            if (measurementsForLast7Days.length) {
                const maxAverage7Days = (0, measurement_aggregation_util_1.calculateAverageMaxForLast7Days)(measurementsForLast7Days, datapoint);
                if (!(0, lodash_1.isNil)(maxAverage7Days.value) && !isNaN(maxAverage7Days.value)) {
                    (0, lodash_1.set)(update, `koc_AggregatedMeasurements.${datapoint}_7days_max_avg`, maxAverage7Days);
                    this.logger.log(`=> Max average ${maxAverage7Days.value}`);
                }
                const percentile7Days = (0, measurement_aggregation_util_1.calculatePercentile)(measurementsForLast7Days, datapoint);
                if (!(0, lodash_1.isNil)(percentile7Days.value) && !isNaN(percentile7Days.value)) {
                    (0, lodash_1.set)(update, `koc_AggregatedMeasurements.${datapoint}_7days_90p`, percentile7Days);
                    this.logger.log(`=> 90th percentile ${percentile7Days.value}`);
                }
            }
            else {
                this.logger.log(`=> No measurements found.`);
            }
            this.logger.log(`Calculate Ø 4 weeks for ${datapoint} of device ${device.name}`);
            const measurementsForLast4Weeks = await this.api.fetchMeasurements((0, measurement_fetch_util_1.datesForLast4Weeks)(), device.id, datapoint);
            if (measurementsForLast4Weeks.length) {
                const maxAverage4Weeks = (0, measurement_aggregation_util_1.calculateAverageMaxForLast4Weeks)(measurementsForLast4Weeks, datapoint);
                if (!(0, lodash_1.isNil)(maxAverage4Weeks.value) && !isNaN(maxAverage4Weeks.value)) {
                    (0, lodash_1.set)(update, `koc_AggregatedMeasurements.${datapoint}_4weeks_max_avg`, maxAverage4Weeks);
                    this.logger.log(`=> Max average ${maxAverage4Weeks.value}`);
                }
                const percentile4Weeks = (0, measurement_aggregation_util_1.calculatePercentile)(measurementsForLast4Weeks, datapoint);
                if (!(0, lodash_1.isNil)(percentile4Weeks.value) && !isNaN(percentile4Weeks.value)) {
                    (0, lodash_1.set)(update, `koc_AggregatedMeasurements.${datapoint}_4weeks_90p`, percentile4Weeks);
                    this.logger.log(`=> 90th percentile ${percentile4Weeks.value}`);
                }
            }
            else {
                this.logger.log(`=> No measurements found.`);
            }
        }
        if (Object.keys(update.koc_AggregatedMeasurements).length > 0) {
            this.logger.log(`Updating device ${device.name} with aggregate values...`);
            (0, lodash_1.set)(update.koc_AggregatedMeasurements, 'lastUpdate', new Date().toISOString());
            this.api.updateDevice(device, update);
        }
    }
};
exports.CalculationService = CalculationService;
exports.CalculationService = CalculationService = CalculationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_service_1.APIService])
], CalculationService);
//# sourceMappingURL=calculation.service.js.map