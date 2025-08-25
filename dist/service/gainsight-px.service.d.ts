import { CustomEventsResponse, CustomEvent, PXParams, PageViewEventResponse, IdentifyEventResponse, FeaturePagination, FeaturesResponse, FeatureJSON, UserFilter, UserSort, CustomEventFilter, CustomEventSort, PageViewFilter, PageViewSort, IdentifyEventFilter, IdentifyEventSort, UsersResponse, User } from '../model/gainsight-px.model';
export declare class GainsightPxService {
    private readonly apiClient;
    private readonly apiKey;
    private readonly baseUrl;
    constructor();
    getCustomEvents(parameters?: PXParams<CustomEventFilter, CustomEventSort>): Promise<CustomEventsResponse>;
    getPageViews(parameters?: PXParams<PageViewFilter, PageViewSort>): Promise<PageViewEventResponse>;
    getIdentifyId(parameters?: PXParams<IdentifyEventFilter, IdentifyEventSort>): Promise<IdentifyEventResponse>;
    getFeatures(parameters?: FeaturePagination): Promise<FeaturesResponse>;
    getFeaturesV2(parameters?: FeaturePagination): Promise<FeaturesResponse>;
    private applyParams;
    getCustomEventById(id: string): Promise<CustomEvent>;
    getUsers(parameters?: PXParams<UserFilter, UserSort>): Promise<UsersResponse>;
    removePrivacyData(users: User[]): void[];
    getFeatureByKey(key: string): Promise<FeatureJSON>;
    getFeaturesHierarchy(): Promise<FeaturesResponse>;
    private getActiveFeatures;
    private calculateFeatureHierarchyPath;
    shortHash(input: string, length?: number): string;
    private abbreviateParentName;
    private normalizeName;
    getFeatureById(id: string): Promise<any>;
    getAllCustomEvents(params: PXParams<CustomEventFilter, CustomEventSort>): Promise<void>;
}
