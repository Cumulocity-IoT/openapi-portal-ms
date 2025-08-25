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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GainsightPxService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const lodash_1 = require("lodash");
const gainsight_px_model_1 = require("../model/gainsight-px.model");
const crypto_1 = require("crypto");
let GainsightPxService = class GainsightPxService {
    constructor() {
        this.apiKey = '04af65bc-d5a9-4428-aaf4-6e3b12c07087';
        this.baseUrl = 'https://api.aptrinsic.com/v1/';
        this.apiClient = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'X-APTRINSIC-API-KEY': this.apiKey,
                Accept: 'application/json',
            },
        });
    }
    async getCustomEvents(parameters) {
        try {
            const params = this.applyParams(parameters);
            const response = await this.apiClient.get('/events/custom', { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching custom events: ${error.message}`);
        }
    }
    async getPageViews(parameters) {
        try {
            const params = this.applyParams(parameters);
            const response = await this.apiClient.get('/events/pageView', { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching page views: ${error.message}`);
        }
    }
    async getIdentifyId(parameters) {
        try {
            const params = this.applyParams(parameters);
            const response = await this.apiClient.get('/events/identify', { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching identify events: ${error.message}`);
        }
    }
    async getFeatures(parameters) {
        const params = this.applyParams(parameters);
        const response = await this.apiClient.get('/feature', { params });
        return response.data;
    }
    async getFeaturesV2(parameters) {
        const params = this.applyParams(parameters);
        const api = axios_1.default.create({
            baseURL: 'https://api.aptrinsic.com/v2',
            headers: {
                'X-APTRINSIC-API-KEY': this.apiKey,
                Accept: 'application/json',
            },
        });
        const response = await api.get(`/feature_ext`, { params });
        return response.data;
    }
    applyParams(parameters) {
        const params = {};
        if (!(0, lodash_1.isNil)(parameters) && Object.keys(parameters).length) {
            for (const [key, value] of Object.entries(parameters)) {
                if (!(0, lodash_1.isNil)(value)) {
                    params[key] = value.toString();
                }
            }
        }
        return params;
    }
    async getCustomEventById(id) {
        const res = await this.getCustomEvents({ filter: `identifyId==${id}` });
        console.log(res);
        if (res.customEvents.length === 1) {
            return res.customEvents[0];
        }
        else {
            return undefined;
        }
    }
    async getUsers(parameters) {
        try {
            const params = this.applyParams(parameters);
            const response = await this.apiClient.get('/users', { params });
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching custom events: ${error.message}`);
        }
    }
    removePrivacyData(users) {
        return users.map((user) => {
            if (user.firstName)
                user.firstName = (0, crypto_1.createHash)('sha256').update(user.firstName).digest().toString('hex');
            if (user.lastName)
                user.lastName = (0, crypto_1.createHash)('sha256').update(user.lastName).digest().toString('hex');
            if (user.email)
                user.email = (0, crypto_1.createHash)('sha256').update(user.email).digest().toString('hex');
        });
    }
    async getFeatureByKey(key) {
        const response = await this.apiClient.get(`/feature/${key}`);
        return response.data;
    }
    async getFeaturesHierarchy() {
        const results = [];
        const pagination = {
            pageSize: 100,
            pageNumber: 0,
        };
        let res = await this.getFeaturesV2(pagination);
        results.push(res);
        while (!res.isLastPage) {
            res = await this.getFeaturesV2(pagination);
            results.push(res);
        }
        const features = results.flatMap((res) => res.features);
        console.log(JSON.stringify(features));
        const featureClasses = features.map((feature) => new gainsight_px_model_1.Feature(feature));
        for (const feature of featureClasses) {
            if (feature.parentFeatureId) {
                const parent = featureClasses.find((f) => f.id === feature.parentFeatureId);
                if (parent) {
                    parent.children.push(feature);
                    feature.parent = parent;
                }
            }
        }
        for (const feature of featureClasses) {
            if (feature.parent) {
                feature.hierarchyPath = this.calculateFeatureHierarchyPath(feature, featureClasses);
            }
        }
        const allowList = ['Header', 'Cockpit', 'Device Management', 'Administration'];
        const rootModules = featureClasses.filter((feature) => feature.parentFeatureId == null && allowList.includes(feature.name));
        const childFeatures = rootModules.flatMap((feature) => this.getActiveFeatures(feature));
        for (const feature of childFeatures) {
            if (feature.parent) {
                feature.hierarchyPath = this.calculateFeatureHierarchyPath(feature, featureClasses);
            }
        }
        const names = childFeatures.map((feature) => `${this.shortHash(feature.hierarchyPath)}_${feature.name}`);
        const nameCounts = names.reduce((acc, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        console.log('Name counts:', nameCounts);
        return res;
    }
    getActiveFeatures(module) {
        const features = [];
        for (const child of module.children) {
            if (child.children.length > 0) {
                features.push(...this.getActiveFeatures(child));
            }
            if (child.type === 'FEATURE' && child.status === 'ACTIVATED') {
                features.push(child);
            }
        }
        return features;
    }
    calculateFeatureHierarchyPath(feature, features) {
        if (feature.parent) {
            feature.hierarchyPath = `${feature.parent}.${feature.name}`;
        }
        else {
            feature.hierarchyPath = feature.name;
        }
        return feature.hierarchyPath;
    }
    shortHash(input, length = 4) {
        const hash = (0, crypto_1.createHash)('sha256').update(input).digest();
        const num = hash.readUInt32BE(0);
        return num.toString(36).slice(0, length);
    }
    abbreviateParentName(name) {
        const trimmed = name.trim();
        if (trimmed.length <= 2)
            return trimmed;
        return `${trimmed[0]}${trimmed.length - 2}${trimmed[trimmed.length - 1]}`;
    }
    normalizeName(name) {
        return name
            .split(' ')
            .map((word) => word.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, (c) => c.toUpperCase()))
            .join('');
    }
    async getFeatureById(id) {
        const response = await this.apiClient.get(`/feature/${id}`);
        return response.data;
    }
    async getAllCustomEvents(params) {
        params.pageSize = 1000;
        const results = [];
        let res = await this.getCustomEvents(params);
        results.push(...res.customEvents);
        let scrollId = res.scrollId;
        console.log('First batch');
        let page = 1;
        let hits = 1000;
        while (hits === 1000) {
            params.scrollId = scrollId;
            res = await this.getCustomEvents(params);
            console.log(`Page ${page++}`);
            results.push(...res.customEvents);
            scrollId = res.scrollId;
            hits = res.customEvents.length;
            console.log(`Hits ${hits}`);
        }
        const ids = (0, lodash_1.uniqBy)(results, 'accountId').map((e) => e.accountId);
        const match = ids.find((e) => e.includes('t140168379'));
        if (match) {
            console.log('Found match:', match);
        }
        else {
            console.log('No match found');
        }
    }
};
exports.GainsightPxService = GainsightPxService;
exports.GainsightPxService = GainsightPxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GainsightPxService);
//# sourceMappingURL=gainsight-px.service.js.map