"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIService = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const VENTINGWELL_GROUP_ID = '44699660';
const BOREHOLE_GROUP_ID = '95699833';
let APIService = class APIService {
    fetchOrbDevices() {
        return Promise.all([this.fetchBoreholes(), this.fetchVentingWells()]).then((res) => (0, lodash_1.uniqBy)([...res[0], ...res[1]], 'id'));
    }
    updateDevice(device, update) {
        return this.client.inventory.update({
            id: device.id,
            ...update,
        });
    }
    fetchBoreholes() {
        return this.client.inventory
            .list({
            pageSize: 2000,
            query: `bygroupid(${BOREHOLE_GROUP_ID})`,
        })
            .then((response) => {
            if (response.data?.length) {
                return response.data;
            }
            else {
                throw new Error(`Empty bore hole group or not existing with id ${BOREHOLE_GROUP_ID}`);
            }
        })
            .catch(() => {
            return this.client.inventory
                .list({
                pageSize: 1,
                query: `name eq 'Bore Holes'`,
            })
                .then((res) => {
                const id = res.data[0]?.id;
                return this.client.inventory
                    .list({
                    pageSize: 2000,
                    query: `bygroupid(${id})`,
                })
                    .then((res) => res.data);
            });
        });
    }
    fetchVentingWells() {
        return this.client.inventory
            .list({
            pageSize: 2000,
            query: `bygroupid(${VENTINGWELL_GROUP_ID})`,
        })
            .then((response) => {
            if (response.data?.length) {
                return response.data;
            }
            else {
                throw new Error(`Empty venting well group or not existing with id ${VENTINGWELL_GROUP_ID}`);
            }
        })
            .catch(() => {
            return this.client.inventory
                .list({
                pageSize: 1,
                withTotalPages: false,
                query: `name eq 'Venting Well'`,
            })
                .then((res) => {
                const id = res.data[0]?.id;
                return this.client.inventory
                    .list({
                    pageSize: 2000,
                    query: `bygroupid(${id})`,
                })
                    .then((res) => res.data);
            });
        });
    }
    async fetchMeasurements(dates, source, datapoint) {
        const [valueFragmentType, valueFragmentSeries] = datapoint.split('.');
        const data = await this.fetchAllMeasurements(this.client, {
            ...dates,
            source,
            valueFragmentType,
            valueFragmentSeries,
            pageSize: 2000,
        });
        return data;
    }
    async fetchLatestMeasurement(datapoint, source) {
        const [valueFragmentType, valueFragmentSeries] = datapoint.split('.');
        const { data } = await this.client.measurement.list({
            source,
            dateFrom: '1970-01-01',
            dateTo: new Date().toISOString(),
            revert: true,
            valueFragmentType,
            valueFragmentSeries,
            pageSize: 1,
            withTotalPages: false,
        });
        if (data.length === 1) {
            return data[0];
        }
        return undefined;
    }
    async fetchAllMeasurements(client, filter, MAX_PAGES = 5) {
        try {
            const mos = [];
            let res = await client.measurement.list({
                ...filter,
                withTotalPages: true,
            });
            while (res.data.length) {
                mos.push(...res.data);
                if (!res.paging?.nextPage) {
                    break;
                }
                if (res.paging?.nextPage > MAX_PAGES) {
                    console.error(`MAX_PAGES (${MAX_PAGES}) exceeded (${res.paging?.totalPages}): list measurements (${JSON.stringify(filter)})`);
                    break;
                }
                res = await res.paging.next();
            }
            return mos;
        }
        catch (e) {
            console.error(e);
            return [];
        }
    }
    async fetchSupportedSeries(device) {
        return this.client.inventory.getSupportedSeries(device);
    }
    createTenantOption(option) {
        return this.client.options.tenant.create(option);
    }
    getTenantOption(option) {
        return this.client.options.tenant.detail(option);
    }
};
exports.APIService = APIService;
exports.APIService = APIService = __decorate([
    (0, common_1.Injectable)()
], APIService);
//# sourceMappingURL=api.service.js.map