import { CustomEvent, CustomUserAttributes, LastVisitedUserAgentData, PageView, PXLocation, SessionEvent, User } from "./gainsight-px.model";

export type CachedEvent = {
  name: string;
  data: Record<string, any>;
  date: number;
  iId: string;
  sId: string;
};

/**
 * Maps Gainsight PX custom events to the compact cached representation.
 *
 * Field mappings:
 * - `name`  ← `CustomEvent.eventName`
 * - `data`  ← `CustomEvent.attributes`
 * - `date`  ← `CustomEvent.date`
 * - `iId`   ← `CustomEvent.identifyId`
 * - `sId`   ← `CustomEvent.sessionId`
 */
export function mapCustomEventsToCachedEvents(events: CustomEvent[]): CachedEvent[] {
  return events.map((e) => ({
    name: e.eventName,
    data: e.attributes,
    date: e.date,
    iId: e.identifyId,
    sId: e.sessionId,
  }));
}

export type CachedUser = {
  iId: string;
  sId: string;
  date: number;
  signUpDate: number;
  emailDomain: string;
  type: "LEAD" | "USER" | "VISITOR" | "EMPTY_USER_TYPE";
  attrs: CustomUserAttributes;
  agent: LastVisitedUserAgentData[];
  location: PXLocation;
};

/**
 * Maps Gainsight PX users to the compact cached representation.
 *
 * Field mappings:
 * - `iId`       ← `User.identifyId`
 * - `sId`       ← `User.id`
 * - `date`      ← `User.lastSeenDate`
 * - `signUpDate`← `User.signUpDate`
 * - `emailDomain` ← domain extracted from `User.email` (e.g., "test.de" from "hans@test.de")
 * - `type`      ← `User.type`
 * - `attrs`     ← `User.customAttributes`
 * - `agent`     ← `User.lastVisitedUserAgentData` (defaults to `[]` when absent)
 * - `location`  ← `User.lastInferredLocation`
 */
function extractEmailDomain(email: string | undefined): string {
  if (!email) return "";
  const atIndex = email.lastIndexOf("@");
  return atIndex > 0 ? email.substring(atIndex + 1) : "";
}

export function mapUsersToCachedUsers(users: User[]): CachedUser[] {
  return users.map((u) => ({
    iId: u.identifyId,
    sId: u.id,
    date: u.lastSeenDate,
    signUpDate: u.signUpDate,
    emailDomain: extractEmailDomain(u.email),
    type: u.type,
    attrs: u.customAttributes,
    agent: u.lastVisitedUserAgentData ?? [],
    location: u.lastInferredLocation,
  }));
}

export type CachedPageView = {
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
  id: string;
  iId: string;
  propertyKey: string;
  date: number;
  eventType: string;
  sId: string;
  userType: string;
  accountId: string;
  globalContext: object[];
};

/**
 * Maps Gainsight PX page-view events to the compact cached representation.
 *
 * Field mappings:
 * - `scheme`      ← `PageView.scheme`
 * - `host`        ← `PageView.host`
 * - `path`        ← `PageView.path`
 * - `queryString` ← `PageView.queryString`
 * - `hash`        ← `PageView.hash`
 * - `queryParams` ← `PageView.queryParams`
 * - `remoteHost`  ← `PageView.remoteHost`
 * - `referrer`    ← `PageView.referrer`
 * - `screenHeight`← `PageView.screenHeight`
 * - `screenWidth` ← `PageView.screenWidth`
 * - `languages`   ← `PageView.languages`
 * - `pageTitle`   ← `PageView.pageTitle`
 * - `id`          ← `PageView.eventId`
 * - `iId`         ← `PageView.identifyId`
 * - `propertyKey` ← `PageView.propertyKey`
 * - `date`        ← `PageView.date`
 * - `eventType`   ← `PageView.eventType`
 * - `sId`         ← `PageView.sessionId`
 * - `userType`    ← `PageView.userType`
 * - `accountId`   ← `PageView.accountId`
 * - `globalContext`← `PageView.globalContext`
 */
export function mapPageViewsToCachedPageViews(pageViews: PageView[]): CachedPageView[] {
  return pageViews.map((p) => ({
    scheme: p.scheme,
    host: p.host,
    path: p.path,
    queryString: p.queryString,
    hash: p.hash,
    queryParams: p.queryParams,
    remoteHost: p.remoteHost,
    referrer: p.referrer,
    screenHeight: p.screenHeight,
    screenWidth: p.screenWidth,
    languages: p.languages,
    pageTitle: p.pageTitle,
    id: p.eventId,
    iId: p.identifyId,
    propertyKey: p.propertyKey,
    date: p.date,
    eventType: p.eventType,
    sId: p.sessionId,
    userType: p.userType,
    accountId: p.accountId,
    globalContext: p.globalContext,
  }));
}

export type CachedSessionEvent = {
  id: string;
  iId: string;
  propertyKey: string;
  date: number;
  eventType: string;
  sId: string;
  aId: string;
  globalContext: object[];
  remoteHost: string;
  location: PXLocation;
  userType: "LEAD" | "USER" | "VISITOR" | "EMPTY_USER_TYPE";
};

/**
 * Maps Gainsight PX session-initialized events to the compact cached representation.
 *
 * Field mappings:
 * - `id`           ← `SessionEvent.eventId`
 * - `iId`          ← `SessionEvent.identifyId`
 * - `propertyKey`  ← `SessionEvent.propertyKey`
 * - `date`         ← `SessionEvent.date`
 * - `eventType`    ← `SessionEvent.eventType`
 * - `sId`          ← `SessionEvent.sessionId`
 * - `aId`          ← `SessionEvent.accountId`
 * - `globalContext` ← `SessionEvent.globalContext`
 * - `remoteHost`   ← `SessionEvent.remoteHost`
 * - `location`     ← `SessionEvent.inferredLocation`
 * - `userType`     ← `SessionEvent.userType`
 */
export function mapSessionEventsToCachedSessionEvents(sessionEvents: SessionEvent[]): CachedSessionEvent[] {
  return sessionEvents.map((s) => ({
    id: s.eventId,
    iId: s.identifyId,
    propertyKey: s.propertyKey,
    date: s.date,
    eventType: s.eventType,
    sId: s.sessionId,
    aId: s.accountId,
    globalContext: s.globalContext,
    remoteHost: s.remoteHost,
    location: s.inferredLocation,
    userType: s.userType,
  }));
}
