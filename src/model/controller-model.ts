import { CachedEvent, CachedPageView, CachedSessionEvent, CachedUser } from "./cache-model";
import { PXLocation } from "./gainsight-px.model";

/**
 * Comma-separated list of {@link ControllerUser} attribute names.
 * Valid values: `id`, `roles`, `country`, `sessionId`, `language`, `platform`, `browser`, `device`, `domain`.
 * Example: `"id,roles,location"`
 */
export type ControllerUserFieldList = `${keyof ControllerUser}` extends string ? string : never;

/**
 * The shape returned by the `/v2/activeUsers` endpoint.
 * `id` is always present; all other fields are present only when no `fields`
 * projection is requested, or when that specific field is included in the list.
 */
export type ControllerUserResponse = {
  id: string;
} & Partial<Omit<ControllerUser, "id">>;

/**
 * Represents an active user as returned by the `/v2/activeUsers` endpoint.
 */
export type ControllerUser = {
  id: string;
  roles: string[];
  country: string;
  sessionId: string;
  language: string;
  platform: string;
  browser: string;
  device: string;
  domain: string;
};

/**
 * Represents a mapped event as returned by the `/v2/events` endpoint.
 * `date` is always an ISO 8601 string. `identifyId` and `sessionId` are
 * only present when the caller opts in via the `withId` flag.
 */
export type ControllerEvent = {
  name: string;
  data: Record<string, any>;
  date: string;
  identifyId?: string;
  sessionId?: string;
};

/**
 * Comma-separated list of {@link ControllerEvent} attribute names.
 * Valid values: `name`, `date`, `data`, `identifyId`, `sessionId`.
 * Example: `"name,date,identifyId"`
 */
export type ControllerEventFieldList = `${keyof ControllerEvent}` extends string ? string : never;

/**
 * Comma-separated list of dot-notation field paths to project from `event.data`.
 * Example: `"widgetName,attributes.size"`
 */
export type CachedEventDataFieldList = string;

/**
 * The shape returned by the `/events` endpoint.
 * `name` is always present; all other fields are present only when no `fields`
 * projection is requested, or when that specific field is included in the list.
 */
export type ControllerEventResponse = {
  name: string;
} & Partial<Omit<ControllerEvent, "name">>;

/**
 * Maps a cached custom event to the shape returned by the /events endpoint.
 *
 * Field mappings:
 * - `name`       ← `CachedEvent.name`
 * - `data`       ← `CachedEvent.data`
 * - `date`       ← `CachedEvent.date` (converted to ISO string)
 * - `identifyId` ← `CachedEvent.iId` (only included when `withId` is true)
 * - `sessionId`  ← `CachedEvent.sId` (only included when `withId` is true)
 */
export function mapCachedEventToControllerEvent(e: CachedEvent, withId = false): ControllerEvent {
  return {
    name: e.name,
    data: e.data,
    date: new Date(e.date).toISOString(),
    ...(withId && { identifyId: e.iId, sessionId: e.sId }),
  };
}

/**
 * Maps a cached custom event to the shape returned by the V2 events endpoints.
 *
 * Unlike {@link mapCachedEventToControllerEvent}, this mapper always includes
 * `identifyId` and `sessionId` so that callers can project them in or out via
 * the `fields` query parameter.
 *
 * Field mappings:
 * - `name`       ← `CachedEvent.name`
 * - `data`       ← `CachedEvent.data`
 * - `date`       ← `CachedEvent.date` (converted to ISO string)
 * - `identifyId` ← `CachedEvent.iId` (always included)
 * - `sessionId`  ← `CachedEvent.sId` (always included)
 */
export function mapCachedEventToControllerEventV2(e: CachedEvent): ControllerEvent {
  return {
    name: e.name,
    data: e.data,
    date: new Date(e.date).toISOString(),
    identifyId: e.iId,
    sessionId: e.sId,
  };
}

/**
 * Maps a cached user to the shape returned by the `/v2/activeUsers` endpoint.
 *
 * Field mappings:
 * - `id`        ← `CachedUser.iId`
 * - `sessionId` ← `CachedUser.sId`
 * - `roles`     ← `CachedUser.attrs.userRoles` (split on ",", trimmed)
 * - `country`   ← `CachedUser.location.countryName`
 * - `language`  ← `CachedUser.attrs.userLanguage`
 * - `platform`  ← `CachedUser.agent[0].userAgent.platformType`
 * - `browser`   ← `CachedUser.agent[0].userAgent.browserType`
 * - `device`    ← `CachedUser.agent[0].userAgent.device`
 * - `domain`    ← `CachedUser.attrs.domainName`
 */
export function mapCachedUserToControllerUser(u: CachedUser): ControllerUser {
  const roles = (u.attrs?.userRoles ?? "-").split(",").map((r) => r.trim());
  const country = u.location?.countryName ?? "-";
  const language = u.attrs?.userLanguage || "unknown";
  const [firstAgent] = u.agent ?? [];
  const platform = firstAgent?.userAgent?.platformType || "unknown";
  const browser = firstAgent?.userAgent?.browserType || "unknown";
  const device = firstAgent?.userAgent?.device || "unknown";
  const domain = u.attrs?.domainName ?? "-";
  return {
    id: u.iId,
    roles,
    country,
    sessionId: u.sId,
    language,
    platform,
    browser,
    device,
    domain,
  };
}

/**
 * Represents a page-view event as returned by the `/v2/pageViews` endpoint.
 * `date` is always an ISO 8601 string. Internal Gainsight PX identifiers
 * (`iId`, `sId`) are exposed as `identifyId` and `sessionId`.
 */
export type ControllerPageView = {
  id: string;
  identifyId: string;
  sessionId: string;
  date: string;
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
  propertyKey: string;
  eventType: string;
  userType: string;
  accountId: string;
  globalContext: object[];
};

/**
 * Comma-separated list of {@link ControllerPageView} attribute names.
 * Valid values: `id`, `identifyId`, `sessionId`, `date`, `scheme`, `host`,
 * `path`, `queryString`, `hash`, `queryParams`, `remoteHost`, `referrer`,
 * `screenHeight`, `screenWidth`, `languages`, `pageTitle`, `propertyKey`,
 * `eventType`, `userType`, `accountId`, `globalContext`.
 * Example: `"host,path,pageTitle"`
 */
export type ControllerPageViewFieldList = `${keyof ControllerPageView}` extends string ? string : never;

/**
 * The shape returned by the `/v2/pageViews` endpoint.
 * `id` is always present; all other fields are present only when no `fields`
 * projection is requested, or when that specific field is included in the list.
 */
export type ControllerPageViewResponse = {
  id: string;
} & Partial<Omit<ControllerPageView, "id">>;

/**
 * Maps a cached page-view to the shape returned by the `/v2/pageViews` endpoint.
 *
 * Field mappings:
 * - `id`          ← `CachedPageView.id`
 * - `identifyId`  ← `CachedPageView.iId`
 * - `sessionId`   ← `CachedPageView.sId`
 * - `date`        ← `CachedPageView.date` (converted to ISO string)
 * - all other fields are passed through unchanged
 */
export function mapCachedPageViewToControllerPageView(pv: CachedPageView): ControllerPageView {
  return {
    id: pv.id,
    identifyId: pv.iId,
    sessionId: pv.sId,
    date: new Date(pv.date).toISOString(),
    scheme: pv.scheme,
    host: pv.host,
    path: pv.path,
    queryString: pv.queryString,
    hash: pv.hash,
    queryParams: pv.queryParams,
    remoteHost: pv.remoteHost,
    referrer: pv.referrer,
    screenHeight: pv.screenHeight,
    screenWidth: pv.screenWidth,
    languages: pv.languages,
    pageTitle: pv.pageTitle,
    propertyKey: pv.propertyKey,
    eventType: pv.eventType,
    userType: pv.userType,
    accountId: pv.accountId,
    globalContext: pv.globalContext,
  };
}

/**
 * Represents a session-initialized event as returned by the `/v2/sessionEvents` endpoint.
 * `date` is always an ISO 8601 string. Internal Gainsight PX identifiers
 * (`iId`, `sId`, `aId`) are exposed as `identifyId`, `sessionId`, and `accountId`.
 */
export type ControllerSessionEvent = {
  id: string;
  identifyId: string;
  sessionId: string;
  accountId: string;
  date: string;
  propertyKey: string;
  eventType: string;
  remoteHost: string;
  location: PXLocation;
  userType: string;
  globalContext: object[];
};

/**
 * Comma-separated list of {@link ControllerSessionEvent} attribute names.
 * Valid values: `id`, `identifyId`, `sessionId`, `accountId`, `date`,
 * `propertyKey`, `eventType`, `remoteHost`, `location`, `userType`, `globalContext`.
 * Example: `"id,identifyId,date,userType"`
 */
export type ControllerSessionEventFieldList = `${keyof ControllerSessionEvent}` extends string ? string : never;

/**
 * The shape returned by the `/v2/sessionEvents` endpoint.
 * `id` is always present; all other fields are present only when no `fields`
 * projection is requested, or when that specific field is included in the list.
 */
export type ControllerSessionEventResponse = {
  id: string;
} & Partial<Omit<ControllerSessionEvent, "id">>;

/**
 * Maps a cached session event to the shape returned by the `/v2/sessionEvents` endpoint.
 *
 * Field mappings:
 * - `id`          ← `CachedSessionEvent.id`
 * - `identifyId`  ← `CachedSessionEvent.iId`
 * - `sessionId`   ← `CachedSessionEvent.sId`
 * - `accountId`   ← `CachedSessionEvent.aId`
 * - `date`        ← `CachedSessionEvent.date` (converted to ISO string)
 * - all other fields are passed through unchanged
 */
export function mapCachedSessionEventToControllerSessionEvent(s: CachedSessionEvent): ControllerSessionEvent {
  return {
    id: s.id,
    identifyId: s.iId,
    sessionId: s.sId,
    accountId: s.aId,
    date: new Date(s.date).toISOString(),
    propertyKey: s.propertyKey,
    eventType: s.eventType,
    remoteHost: s.remoteHost,
    location: s.location,
    userType: s.userType,
    globalContext: s.globalContext,
  };
}
