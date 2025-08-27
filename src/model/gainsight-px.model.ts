export type CustomEvent = {
  eventName: string;
  attributes: Record<string, any>;
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
  globalContext: Record<string, any>;
};

export type CustomEventsResponse = {
  customEvents: CustomEvent[];
} & Pagination;

export type SessionEvent = {
  eventId: string;
  identifyId: string;
  propertyKey: string;
  date: number;
  eventType: string;
  sessionId: 'LEAD' | 'USER' | 'VISITOR' | 'EMPTY_USER_TYPE';
  accountId: string;
  globalContext: object[];
  remoteHost: string;
  inferredLocation: PXLocation;
};

export type SessionEventsResponse = {
  sessionInitializedEvents: SessionEvent[];
} & Pagination;

export type PXLocation = {
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
  lastVisitedUserAgentData?: {
    propertyKey: string;
    userAgent: {
      device: string;
      platformType: string;
      browserType: string;
    };
  }[];
  lastInferredLocation: PXLocation;
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

export type SessionEventFilter = `identifyId${Operator}${string}` | `accountId${Operator}${string}` | `date${Operator}${string}`;
export type SessionEventSort = 'accountId' | '-accountId' | 'date' | '-date';

export type PageViewFilter =
  | `identifyId${Operator}${string}`
  | `accountId${Operator}${string}`
  | `date${Operator}${string}`
  | `path${Operator}${string}`
  | `queryString${Operator}${string}`
  | `pageTitle${Operator}${string}`
  | `host${Operator}${string}`;
export type PageViewSort = 'accountId' | '-accountId' | 'date' | '-date';

export type IdentifyEventFilter = `identifyId${Operator}${string}` | `email${Operator}${string}` | `date${Operator}${string}`;
export type IdentifyEventSort = 'accountId' | '-accountId' | 'date' | '-date';

export type CustomAttributes = 'userRoles' | 'instanceId' | 'domainName' | 'versionBE' | 'userName' | 'versionUI' | 'userLanguage';
export type UserFilter =
  | `firstName${Operator}${string}`
  | `lastName${Operator}${string}`
  | `customAttributes.${CustomAttributes}${Operator}${string}`
  | `customAttributes.${string}${Operator}${string}`
  | `location.${string}${Operator}${string}`
  | `lastInferredLocation.${string}${Operator}${string}`
  | `lastVisitedUserAgentData.${string}${Operator}${string}`;
export type UserSort = 'firstName' | '-firstName' | 'lastName' | '-lastName' | 'createDate' | '-createDate' | 'lastSeenDate' | '-lastSeenDate';

export type PXParams<A, B> = {
  filter?: A;
  sort?: B;
  pageSize?: number;
  scrollId?: string;
};

export class Feature implements FeatureJSON {
  children: Feature[] = [];
  parent?: Feature;
  hierarchyPath?: string;
  id: string;
  name: string;
  type: 'FEATURE' | 'MODULE';
  parentFeatureId?: string;
  propertyKey: string;
  status: 'ACTIVATED' | 'DELETED';
  featureLabels: { id: string; name: string; color: string }[];

  constructor(feature: FeatureJSON) {
    this.id = feature.id;
    this.name = feature.name;
    this.type = feature.type;
    this.parentFeatureId = feature.parentFeatureId;
    this.propertyKey = feature.propertyKey;
    this.status = feature.status;
    this.featureLabels = feature.featureLabels;
  }
}

export type FeatureJSON = {
  id: string;
  name: string;
  type: 'FEATURE' | 'MODULE';
  parentFeatureId?: string;
  propertyKey: string;
  status: 'ACTIVATED' | 'DELETED';
  featureLabels: { id: string; name: string; color: string }[];
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
