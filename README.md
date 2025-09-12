# Gainsight Sync Microservice API Documentation

This microservice provides REST API endpoints for querying Gainsight PX data, including custom events, session events, page views, and active user metrics.

## Table of Contents

- [Custom Events](#custom-events)
- [Event Counts](#event-counts)
- [Event Counts By Name](#event-counts-by-name)
- [Session Events](#session-events)
- [Session Events Auto Aggregation](#session-events-auto-aggregation)
- [Page Views](#page-views)
- [Popular Devices](#popular-devices)
- [Page View Counts](#page-view-counts)
- [Active User Metrics](#active-user-metrics)

---

## Custom Events

**GET `/customEvents`**

Retrieve custom events for the `devicemanagement` application.

**Query Parameters:**
- `start` (optional): ISO date string (filters events after this date)
- `end` (optional): ISO date string (filters events before this date)

**Response:**
```json
[
  {
    "date": "2024-01-01T12:00:00.000Z",
    "widgetName": "WidgetA",
    "sessionId": "abc123"
  },
  ...
]
```

---

## Event Counts

**GET `/eventCounts`**

Get counts of custom events grouped by event name for the `devicemanagement` application.

**Query Parameters:**
- `start` (optional): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  { "value": "eventNameA", "count": 42 },
  ...
]
```

---

## Event Counts By Name

**GET `/eventCountsByName`**

Get counts of custom events grouped by widget name for a specific event.

**Query Parameters:**
- `eventName` (required): Event name to filter
- `start` (optional): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  { "name": "WidgetA", "count": 10 },
  ...
]
```

---

## Session Events

**GET `/sessionEvents`**

Retrieve session events for the account.

**Query Parameters:**
- `start` (optional): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  {
    "time": "2024-01-01T12:00:00.000Z",
    "eventId": "evt123",
    "identifyId": "user456",
    "inferredLocation": { ... },
    "userType": "USER"
  },
  ...
]
```

---

## Session Events Auto Aggregation

**GET `/sessionEventsAutoAgg`**

Aggregate session events by minute, hour, or day, depending on the date range.

**Query Parameters:**
- `start` (required): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  { "time": "2024-01-01T12:00:00.000Z", "count": 5 },
  ...
]
```

---

## Page Views

**GET `/pageViews`**

Retrieve page view events for the domain `main.dm-zz-q.ioee10-cloud.com`.

**Query Parameters:**
- `start` (required): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  {
    "scheme": "https",
    "host": "main.dm-zz-q.ioee10-cloud.com",
    "path": "/devices",
    "hash": "#123",
    ...
  },
  ...
]
```

---

## Popular Devices

**GET `/popularDevices`**

Get counts of device IDs (from page view hashes) for the specified date range.

**Query Parameters:**
- `start` (required): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  { "path": "#123", "count": 8 },
  ...
]
```

---

## Page View Counts

**GET `/pageViewCounts`**

Get counts of page views grouped by masked URL (numbers replaced by `*`).

**Query Parameters:**
- `start` (required): ISO date string
- `end` (optional): ISO date string

**Response:**
```json
[
  { "path": "#*", "count": 15 },
  ...
]
```

---

## Active User Metrics

All endpoints below use the domain `main.dm-zz-q.ioee10-cloud.com` and support date filtering.

### Number of Users

**GET `/activeUserMetrics/numberOfUsers`**

Returns the number of active users.

### New Signups

**GET `/activeUserMetrics/newSignups`**

Returns the number of new user signups.

### Top Languages

**GET `/activeUserMetrics/topLanguages`**

Returns the most common user languages.

### Top User Roles

**GET `/activeUserMetrics/topUserRoles`**

Returns the most common user roles.

### Top Countries

**GET `/activeUserMetrics/topCountries`**

Returns the most common user countries.

### Top Platforms

**GET `/activeUserMetrics/topPlatforms`**

Returns the most common platforms.

### Top Browsers

**GET `/activeUserMetrics/topBrowsers`**

Returns the most common browsers.

### Top Device Types

**GET `/activeUserMetrics/topDeviceTypes`**

Returns the most common device types.

### Mail Domain Names

**GET `/activeUserMetrics/mailDomainNames`**

Returns the most common email domain names.

**Query Parameters for all endpoints above:**
- `start` (optional): ISO date string
- `end` (optional): ISO date string

**Response:**  
Each endpoint returns a list or count relevant to the metric.

---

## Error Handling

All endpoints return an error response with a descriptive message if the API