import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { isNil } from "lodash";
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
  SessionEventFilter,
  SessionEventSort,
  SessionEventsResponse,
} from "../model/gainsight-px.model";
import { createHash } from "crypto";

@Injectable()
export class GainsightPxService {
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl: string;
  readonly logger = new Logger(GainsightPxService.name);

  constructor(private apiKey: string) {
    this.baseUrl = "https://api.aptrinsic.com/v1/"; // Adjust if using a different data center
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "X-APTRINSIC-API-KEY": this.apiKey,
        Accept: "application/json",
      },
    });
  }

  async getSessionEvents(
    parameters?: PXParams<SessionEventFilter, SessionEventSort>,
  ): Promise<SessionEventsResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(`GET /events/session, query: ${JSON.stringify(params)}`);
      const response = await this.apiClient.get("/events/session", { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /events/session failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getCustomEvents(
    parameters?: PXParams<CustomEventFilter, CustomEventSort>,
  ): Promise<CustomEventsResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(`GET /events/custom, query: ${JSON.stringify(params)}`);
      const response = await this.apiClient.get("/events/custom", { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /events/custom failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getPageViews(
    parameters?: PXParams<PageViewFilter, PageViewSort>,
  ): Promise<PageViewEventResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(`GET /events/pageView, query: ${JSON.stringify(params)}`);
      const response = await this.apiClient.get("/events/pageView", { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /events/pageView failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getIdentifyId(
    parameters?: PXParams<IdentifyEventFilter, IdentifyEventSort>,
  ): Promise<IdentifyEventResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(`GET /events/identify, query: ${JSON.stringify(params)}`);
      const response = await this.apiClient.get("/events/identify", { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /events/identify failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getFeatures(parameters?: FeaturePagination): Promise<FeaturesResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(`GET /feature, query: ${JSON.stringify(parameters)}`);
      const response = await this.apiClient.get("/feature", { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /feature failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getFeaturesV2(
    parameters?: FeaturePagination,
  ): Promise<FeaturesResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(
        `GET /v2/feature_ext, query: ${JSON.stringify(parameters)}`,
      );
      const api = axios.create({
        baseURL: "https://api.aptrinsic.com/v2",
        headers: {
          "X-APTRINSIC-API-KEY": this.apiKey,
          Accept: "application/json",
        },
      });
      const response = await api.get(`/feature_ext`, { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /v2/feature_ext failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
    if (res.customEvents.length === 1) {
      return res.customEvents[0];
    } else {
      return undefined;
    }
  }

  async getUsers(
    parameters?: PXParams<UserFilter, UserSort>,
  ): Promise<UsersResponse> {
    try {
      const params = this.applyParams(parameters);
      this.logger.log(`GET /users, query: ${JSON.stringify(params)}`);
      const response = await this.apiClient.get("/users", { params });
      return response.data;
    } catch (error) {
      this.logger.error(`GET /users failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getFeatureByKey(key: string): Promise<FeatureJSON> {
    try {
      this.logger.log(`GET /feature/${key}`);
      const response = await this.apiClient.get(`/feature/${key}`);
      return response.data;
    } catch (error) {
      this.logger.error(`GET /feature/${key} failed`, error);
      throw new Error(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
      pagination.pageNumber++;
      res = await this.getFeaturesV2(pagination);
      results.push(res);
    }

    const features = results.flatMap((res) => res.features);
    const featureClasses = features.map((feature) => new Feature(feature));

    for (const feature of featureClasses) {
      if (feature.parentFeatureId) {
        const parent = featureClasses.find(
          (f) => f.id === feature.parentFeatureId,
        );
        if (parent) {
          parent.children.push(feature);
          feature.parent = parent;
        }
      }
    }
    for (const feature of featureClasses) {
      if (feature.parent) {
        feature.hierarchyPath = this.calculateFeatureHierarchyPath(feature);
      }
    }

    // TODO: how to filter by product???
    // filter out inactive features
    // workaround: allowlist of Tree data
    // make allow list configurable
    const allowList = [
      "Header",
      "Cockpit",
      "Device Management",
      "Administration",
    ];
    const rootModules = featureClasses.filter(
      (feature) =>
        feature.parentFeatureId == null && allowList.includes(feature.name),
    );
    const childFeatures = rootModules.flatMap((feature) =>
      this.getActiveFeatures(feature),
    );
    for (const feature of childFeatures) {
      if (feature.parent) {
        feature.hierarchyPath = this.calculateFeatureHierarchyPath(feature);
      }
    }
    const names = childFeatures.map(
      (feature) => `${this.shortHash(feature.hierarchyPath)}_${feature.name}`,
    );
    // console.log('Child paths:', paths);
    // console.log('Too long names:', paths.filter((path) => path?.length > 40));
    const nameCounts = names.reduce(
      (acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    this.logger.debug(`Name counts: ${JSON.stringify(nameCounts)}`);
    return res;
  }

  private getActiveFeatures(module: Feature): Feature[] {
    // recursively get all children of a module
    const features: Feature[] = [];
    for (const child of module.children) {
      if (child.children.length > 0) {
        features.push(...this.getActiveFeatures(child));
      }
      if (child.type === "FEATURE" && child.status === "ACTIVATED") {
        features.push(child);
      }
    }
    return features;
  }

  private calculateFeatureHierarchyPath(feature: Feature) {
    if (feature.parent) {
      feature.hierarchyPath = `${feature.parent}.${feature.name}`;
    } else {
      feature.hierarchyPath = feature.name;
    }
    return feature.hierarchyPath;
  }

  shortHash(input: string, length = 4): string {
    const hash = createHash("sha256").update(input).digest(); // Strong, fast hash
    const num = hash.readUInt32BE(0); // Read first 4 bytes as a number
    return num.toString(36).slice(0, length); // Base36 for shorter output
  }

  async getFeatureById(id: string) {
    const response = await this.apiClient.get(`/feature/${id}`);
    return response.data;
  }

  async getAllCustomEvents(
    params: PXParams<CustomEventFilter, CustomEventSort>,
  ) {
    params.pageSize = 1000;
    const results: CustomEvent[] = [];
    let res = await this.getCustomEvents(params);
    results.push(...res.customEvents);
    let scrollId = res.scrollId;
    let page = 1;
    let hits = 1000;
    while (hits === 1000) {
      params.scrollId = scrollId;
      res = await this.getCustomEvents(params);
      this.logger.log(`Fetched page ${page++}`);
      results.push(...res.customEvents);
      scrollId = res.scrollId;
      hits = res.customEvents.length;
    }
  }

  /**
   * Recursively fetches paginated data using a provided fetch function, applies a filtering rule,
   * and accumulates the results.
   *
   * @template T The type of items being fetched.
   * @param fetchPage - A function that fetches a page of items. It accepts an optional scrollId and returns a promise
   *   resolving to an object containing the items, an optional scrollId for the next page, and an optional pageSize.
   * @param sum - An array to accumulate the filtered items across pages.
   * @param rule - A predicate function to filter items.
   * @param scrollId - (Optional) The scroll identifier for pagination.
   * @returns A promise that resolves to an array of filtered items accumulated from all pages.
   */
  async getWithPagination<T>(
    fetchPage: (
      scrollId?: string,
    ) => Promise<{ items: T[]; scrollId?: string; pageSize?: number }>,
    sum: T[],
    rule: (item: T) => boolean,
    scrollId?: string,
  ): Promise<T[]> {
    const res = await fetchPage(scrollId);
    const pageSize = res.pageSize ?? 100;

    if (res.items.length <= pageSize) {
      const filtered = res.items.filter(rule);
      sum.push(...filtered);
      return sum;
    }

    const lastItem = res.items[res.items.length - 1];
    if (!rule(lastItem)) {
      const filtered = res.items.filter(rule);
      sum.push(...filtered);
      return sum;
    } else {
      sum.push(...res.items);
      return this.getWithPagination(fetchPage, sum, rule, res.scrollId);
    }
  }
}
