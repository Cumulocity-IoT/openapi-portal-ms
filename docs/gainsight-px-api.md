# Gainsight PX Service API Documentation

This document provides detailed information about the available query methods in the GainsightPxService, including their parameters and response structures.

## Table of Contents
- [Custom Events](#custom-events)
- [Page Views](#page-views)
- [Identify Events](#identify-events)
- [Features](#features)
- [Users](#users)

## Custom Events

### `getCustomEvents(parameters?: PXParams<CustomEventFilter, CustomEventSort>)`

Retrieves custom events from the Gainsight PX API.

#### Parameters

- **filter** (optional): Supports the following filters:
  - `identifyId`: Filter by user identification
  - `eventName`: Filter by event name
  - `date`: Filter by date
  
  Operators supported: `==`, `!=`, `>`, `<`, `>=`, `<=`, `~`, `!~`

- **sort** (optional): Sort by:
  - `accountId` or `-accountId`: Sort by account ID (ascending/descending)
  - `date` or `-date`: Sort by date (ascending/descending)

- **pageSize** (optional): Number of items per page
- **scrollId** (optional): ID for pagination

#### Response Structure

```typescript
{
  customEvents: [{
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
  }],
  scrollId: string;
  totalHits: number;
}
```

## Page Views

### `getPageViews(parameters?: PXParams<PageViewFilter, PageViewSort>)`

Retrieves page view events from the Gainsight PX API.

#### Parameters

- **filter** (optional): Supports the following filters:
  - `identifyId`: Filter by user identification
  - `accountId`: Filter by account ID
  - `date`: Filter by date
  - `path`: Filter by page path
  - `queryString`: Filter by query string
  - `pageTitle`: Filter by page title
  - `host`: Filter by host

  Operators supported: `==`, `!=`, `>`, `<`, `>=`, `<=`, `~`, `!~`

- **sort** (optional): Sort by:
  - `accountId` or `-accountId`: Sort by account ID (ascending/descending)
  - `date` or `-date`: Sort by date (ascending/descending)

#### Response Structure

```typescript
{
  results: [{
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
  }],
  scrollId: string;
  totalHits: number;
}
```

## Identify Events

### `getIdentifyId(parameters?: PXParams<IdentifyEventFilter, IdentifyEventSort>)`

Retrieves identify events from the Gainsight PX API.

#### Parameters

- **filter** (optional): Supports the following filters:
  - `identifyId`: Filter by user identification
  - `email`: Filter by email
  - `date`: Filter by date

  Operators supported: `==`, `!=`, `>`, `<`, `>=`, `<=`, `~`, `!~`

- **sort** (optional): Sort by:
  - `accountId` or `-accountId`: Sort by account ID (ascending/descending)
  - `date` or `-date`: Sort by date (ascending/descending)

#### Response Structure

```typescript
{
  identifyEvents: [{
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
  }],
  scrollId: string;
  totalHits: number;
}
```

## Features

### `getFeatures(parameters?: FeaturePagination)` and `getFeaturesV2(parameters?: FeaturePagination)`

Retrieves features from the Gainsight PX API. Version 2 provides extended functionality.

#### Parameters

- **pageSize** (optional): Number of items per page
- **pageNumber** (optional): Page number to retrieve

#### Response Structure

```typescript
{
  features: [{
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
  }],
  pageNumber: number;
  isLastPage: boolean;
}
```

## Users

### `getUsers(parameters?: PXParams<UserFilter, UserSort>)`

Retrieves user information from the Gainsight PX API.

#### Parameters

- **filter** (optional): Supports the following filters:
  - `firstName`: Filter by first name
  - `lastName`: Filter by last name
  - `customAttributes.[attributeName]`: Filter by custom attributes
  - `location.[field]`: Filter by location fields
  - `lastInferredLocation.[field]`: Filter by last inferred location
  - `lastVisitedUserAgentData.[field]`: Filter by user agent data

  Operators supported: `==`, `!=`, `>`, `<`, `>=`, `<=`, `~`, `!~`

- **sort** (optional): Sort by:
  - `firstName` or `-firstName`: Sort by first name (ascending/descending)
  - `lastName` or `-lastName`: Sort by last name (ascending/descending)
  - `createDate` or `-createDate`: Sort by creation date (ascending/descending)

#### Response Structure

```typescript
{
  users: [{
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
    customAttributes: {
        userRoles: string;
        instanceId: string;
        domainName: string;
        versionBE: string;
        userName: string;
        versionUI: string;
        userLanguage: string;
    };
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
  }],
  scrollId: string;
  totalHits: number;
}
```

## Error Handling

All methods throw an Error with a descriptive message if the API request fails. The error message will include details about what went wrong during the API call.
