import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { isNil, uniqBy } from 'lodash';
import {
  CustomEventsResponse,
  CustomEvent,
  PXParams,
  PageViewEventResponse,
  IdentifyEventResponse,
  FeaturePagination,
  FeaturesResponse,
  Feature,
  FeatureJSON,
  UserFilter,
  UserSort,
  CustomEventFilter,
  CustomEventSort,
  PageViewFilter,
  PageViewSort,
  IdentifyEventFilter,
  IdentifyEventSort,
  UsersResponse,
  User,
} from '../model/gainsight-px.model';
import { createHash } from 'crypto';

@Injectable()
export class GainsightPxService {
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private apiKey: string) {
    this.baseUrl = 'https://api.aptrinsic.com/v1/'; // Adjust if using a different data center
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-APTRINSIC-API-KEY': this.apiKey,
        Accept: 'application/json',
      },
    });
  }

  async getCustomEvents(parameters?: PXParams<CustomEventFilter, CustomEventSort>): Promise<CustomEventsResponse> {
    try {
      const params = this.applyParams(parameters);
      const response = await this.apiClient.get('/events/custom', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching custom events: ${error.message}`);
    }
  }

  async getPageViews(parameters?: PXParams<PageViewFilter, PageViewSort>): Promise<PageViewEventResponse> {
    try {
      const params = this.applyParams(parameters);
      const response = await this.apiClient.get('/events/pageView', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching page views: ${error.message}`);
    }
  }

  async getIdentifyId(parameters?: PXParams<IdentifyEventFilter, IdentifyEventSort>): Promise<IdentifyEventResponse> {
    try {
      const params = this.applyParams(parameters);
      const response = await this.apiClient.get('/events/identify', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching identify events: ${error.message}`);
    }
  }

  async getFeatures(parameters?: FeaturePagination): Promise<FeaturesResponse> {
    const params = this.applyParams(parameters);
    const response = await this.apiClient.get('/feature', { params });
    return response.data;
  }

  async getFeaturesV2(parameters?: FeaturePagination): Promise<FeaturesResponse> {
    const params = this.applyParams(parameters);
    const api = axios.create({
      baseURL: 'https://api.aptrinsic.com/v2',
      headers: {
        'X-APTRINSIC-API-KEY': this.apiKey,
        Accept: 'application/json',
      },
    });
    const response = await api.get(`/feature_ext`, { params });
    return response.data;
  }

  private applyParams(parameters?: object) {
    const params: Record<string, string> = {};
    if (!isNil(parameters) && Object.keys(parameters).length) {
      for (const [key, value] of Object.entries(parameters)) {
        if (!isNil(value)) {
          params[key] = value.toString();
        }
      }
    }
    return params;
  }

  async getCustomEventById(id: string): Promise<CustomEvent> {
    const res = await this.getCustomEvents({ filter: `identifyId==${id}` });
    console.log(res);
    if (res.customEvents.length === 1) {
      return res.customEvents[0];
    } else {
      return undefined;
    }
  }

  async getUsers(parameters?: PXParams<UserFilter, UserSort>): Promise<UsersResponse> {
    try {
      const params = this.applyParams(parameters);
      const response = await this.apiClient.get('/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching custom events: ${error.message}`);
    }
  }

  removePrivacyData(users: User[]) {
    return users.map((user) => {
      if (user.firstName) user.firstName = createHash('sha256').update(user.firstName).digest().toString('hex');
      if (user.lastName) user.lastName = createHash('sha256').update(user.lastName).digest().toString('hex');
      if (user.email) user.email = createHash('sha256').update(user.email).digest().toString('hex');
      return user;
    });
  }

  async getFeatureByKey(key: string): Promise<FeatureJSON> {
    const response = await this.apiClient.get(`/feature/${key}`);
    return response.data;
  }

  async getFeaturesHierarchy() {
    const results: FeaturesResponse[] = [];
    const pagination: FeaturePagination = {
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
    const featureClasses = features.map((feature) => new Feature(feature));

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

    // TODO: how to filter by product???
    // filter out inactive features
    // workaround: allowlist of Tree data
    // make allow list configurable
    const allowList = ['Header', 'Cockpit', 'Device Management', 'Administration'];
    const rootModules = featureClasses.filter((feature) => feature.parentFeatureId == null && allowList.includes(feature.name));
    const childFeatures = rootModules.flatMap((feature) => this.getActiveFeatures(feature));
    for (const feature of childFeatures) {
      if (feature.parent) {
        feature.hierarchyPath = this.calculateFeatureHierarchyPath(feature, featureClasses);
      }
    }
    const names = childFeatures.map((feature) => `${this.shortHash(feature.hierarchyPath)}_${feature.name}`);
    // console.log('Child paths:', paths);
    // console.log('Too long names:', paths.filter((path) => path?.length > 40));
    const nameCounts = names.reduce(
      (acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('Name counts:', nameCounts);
    return res;
  }

  private getActiveFeatures(module: Feature): Feature[] {
    // recursively get all children of a module
    const features: Feature[] = [];
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

  private calculateFeatureHierarchyPath(feature: Feature, features: Feature[]) {
    if (feature.parent) {
      feature.hierarchyPath = `${feature.parent}.${feature.name}`;
    } else {
      feature.hierarchyPath = feature.name;
    }
    return feature.hierarchyPath;
  }

  shortHash(input: string, length = 4): string {
    const hash = createHash('sha256').update(input).digest(); // Strong, fast hash
    const num = hash.readUInt32BE(0); // Read first 4 bytes as a number
    return num.toString(36).slice(0, length); // Base36 for shorter output
  }

  private abbreviateParentName(name: string) {
    const trimmed = name.trim();
    if (trimmed.length <= 2) return trimmed;
    return `${trimmed[0]}${trimmed.length - 2}${trimmed[trimmed.length - 1]}`;
  }

  private normalizeName(name: string) {
    return name
      .split(' ')
      .map((word) => word.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, (c) => c.toUpperCase()))
      .join('');
  }

  async getFeatureById(id: string) {
    const response = await this.apiClient.get(`/feature/${id}`);
    return response.data;
  }

  async getAllCustomEvents(params: PXParams<CustomEventFilter, CustomEventSort>) {
    params.pageSize = 1000;
    const results: CustomEvent[] = [];
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
    const ids = uniqBy(results, 'accountId').map((e) => e.accountId);
    const match = ids.find((e) => e.includes('t140168379'));
    if (match) {
      console.log('Found match:', match);
    } else {
      console.log('No match found');
    }
  }
}
