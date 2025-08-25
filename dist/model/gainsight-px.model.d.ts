export type CustomEvent = {
    eventName: string;
    attributes: object;
    url: string;
    referrer: string;
    remoteHost: string;
    eventId: string;
    identifyId: string;
    propertyKey: string;
    date: number;
    eventType: string;
    sessionId: string;
    userType: string;
    accountId: string;
    globalContext: object;
};
export type CustomEventsResponse = {
    customEvents: CustomEvent[];
} & Pagination;
export type PageView = {
    scheme: string;
    host: string;
    path: string;
    queryString: string;
    hash: string;
    queryParams: object;
    remoteHost: string;
    referrer: string;
    screenHeight: number;
    screenWidth: number;
    languages: string[];
    pageTitle: string;
    eventId: string;
    identifyId: string;
    propertyKey: string;
    date: number | string;
    eventType: string;
    sessionId: string;
    userType: string;
    accountId: string;
    globalContext: object[];
};
export type PageViewEventResponse = {
    results: PageView[];
} & Pagination;
export type IdentifyEvent = {
    email: string;
    eventId: string;
    identifyId: string;
    propertyKey: string;
    date: number | string;
    eventType: string;
    sessionId: string;
    userType: string;
    accountId: string;
    globalContext: object[];
};
export type IdentifyEventResponse = {
    identifyEvents: CustomEvent[];
} & Pagination;
export type User = {
    id: string;
    identifyId: string;
    firstName: string;
    lastName: string;
    numberOfVisits: number;
    score: number;
    email: string;
    firstVisitDate: number;
    signUpDate: number;
    lastSeenDate: number;
    createDate: number;
    lastModifiedDate: number;
    type: 'LEAD' | 'USER' | 'VISITOR' | 'EMPTY_USER_TYPE';
    title: string;
    phone: string;
    role: string;
    accountId: string;
    customAttributes: Record<string, string>;
    lastInferredLocation: {
        countryName: string;
        countryCode: string;
        stateName: string;
        stateCode: string;
        city: string;
        street: string;
        postalCode: string;
        continent: string;
        regionName: string;
        timeZone: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
};
export type UsersResponse = {
    users: User[];
} & Pagination;
export type Pagination = {
    scrollId: string;
    totalHits: number;
};
export type Operator = '==' | '!=' | '>' | '<' | '>=' | '<=' | '~' | '!~';
export type CustomEventFilter = `identifyId${Operator}${string}` | `eventName${Operator}${string}` | `date${Operator}${string}`;
export type CustomEventSort = 'accountId' | '-accountId' | 'date' | '-date';
export type PageViewFilter = `identifyId${Operator}${string}` | `accountId${Operator}${string}` | `date${Operator}${string}` | `path${Operator}${string}` | `queryString${Operator}${string}` | `pageTitle${Operator}${string}` | `host${Operator}${string}`;
export type PageViewSort = 'accountId' | '-accountId' | 'date' | '-date';
export type IdentifyEventFilter = `identifyId${Operator}${string}` | `email${Operator}${string}` | `date${Operator}${string}`;
export type IdentifyEventSort = 'accountId' | '-accountId' | 'date' | '-date';
export type CustomAttributes = 'userRoles' | 'instanceId' | 'domainName' | 'versionBE' | 'userName' | 'versionUI' | 'userLanguage';
export type UserFilter = `firstName${Operator}${string}` | `lastName${Operator}${string}` | `customAttributes.${CustomAttributes}${Operator}${string}` | `customAttributes.${string}${Operator}${string}` | `location.${string}${Operator}${string}` | `lastInferredLocation.${string}${Operator}${string}` | `lastVisitedUserAgentData.${string}${Operator}${string}`;
export type UserSort = 'firstName' | '-firstName' | 'lastName' | '-lastName' | 'createDate' | '-createDate' | 'lastSeenDate' | '-lastSeenDate';
export type PXParams<A, B> = {
    filter?: A;
    sort?: B;
    pageSize?: number;
    scrollId?: string;
};
export declare class Feature implements FeatureJSON {
    children: Feature[];
    parent?: Feature;
    hierarchyPath?: string;
    id: string;
    name: string;
    type: 'FEATURE' | 'MODULE';
    parentFeatureId?: string;
    propertyKey: string;
    status: 'ACTIVATED' | 'DELETED';
    featureLabels: {
        id: string;
        name: string;
        color: string;
    }[];
    constructor(feature: FeatureJSON);
}
export type FeatureJSON = {
    id: string;
    name: string;
    type: 'FEATURE' | 'MODULE';
    parentFeatureId?: string;
    propertyKey: string;
    status: 'ACTIVATED' | 'DELETED';
    featureLabels: {
        id: string;
        name: string;
        color: string;
    }[];
};
export type FeaturesResponse = {
    features: FeatureJSON[];
    pageNumber: number;
    isLastPage: boolean;
};
export type FeaturePagination = {
    pageSize: number;
    pageNumber: number;
};
