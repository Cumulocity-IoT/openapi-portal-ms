import {
  mapCustomEventsToCachedEvents,
  mapPageViewsToCachedPageViews,
  mapSessionEventsToCachedSessionEvents,
  mapUsersToCachedUsers,
} from "./cache-model";
import {
  CustomEvent,
  PageView,
  PXLocation,
  SessionEvent,
  User,
} from "./gainsight-px.model";

const location: PXLocation = {
  countryName: "United States",
  countryCode: "US",
  stateName: "California",
  stateCode: "CA",
  city: "San Francisco",
  street: "Market St",
  postalCode: "94105",
  continent: "North America",
  regionName: "West",
  timeZone: "America/Los_Angeles",
  coordinates: { latitude: 37.7749, longitude: -122.4194 },
};

describe("mapCustomEventsToCachedEvents", () => {
  const event: CustomEvent = {
    eventName: "ButtonClick",
    attributes: { color: "blue" },
    url: "https://example.com/page",
    referrer: "https://example.com",
    remoteHost: "10.0.0.1",
    eventId: "evt-001",
    identifyId: "iid-001",
    propertyKey: "prop-key",
    date: 1_700_000_000_000,
    eventType: "CUSTOM",
    sessionId: "sid-001",
    userType: "USER",
    accountId: "acc-001",
    globalContext: {},
  };

  it("maps a single event correctly", () => {
    const [result] = mapCustomEventsToCachedEvents([event]);
    expect(result.name).toBe("ButtonClick");
    expect(result.data).toEqual({ color: "blue" });
    expect(result.date).toBe(1_700_000_000_000);
    expect(result.iId).toBe("iid-001");
    expect(result.sId).toBe("sid-001");
  });

  it("returns an empty array when given no events", () => {
    expect(mapCustomEventsToCachedEvents([])).toEqual([]);
  });

  it("maps multiple events", () => {
    const second: CustomEvent = { ...event, eventName: "PageLoad", identifyId: "iid-002" };
    const result = mapCustomEventsToCachedEvents([event, second]);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe("PageLoad");
    expect(result[1].iId).toBe("iid-002");
  });
});

describe("mapUsersToCachedUsers", () => {
  const user: User = {
    id: "usr-001",
    identifyId: "iid-001",
    firstName: "Jane",
    lastName: "Doe",
    numberOfVisits: 5,
    score: 42,
    email: "jane@example.com",
    firstVisitDate: 1_600_000_000_000,
    signUpDate: 1_600_000_000_000,
    lastSeenDate: 1_700_000_000_000,
    createDate: 1_600_000_000_000,
    lastModifiedDate: 1_700_000_000_000,
    type: "USER",
    title: "Engineer",
    phone: "555-0100",
    role: "admin",
    accountId: "acc-001",
    customAttributes: {
      userRoles: "admin",
      instanceId: "inst-001",
      domainName: "example.com",
      tenantID: "t001",
      engagements: true,
      fullTracking: false,
      customBranding: false,
      userName: "jdoe",
      isUserCreatedAfterAnonymizationWasActivated: false,
      userLanguage: "en",
    },
    lastVisitedUserAgentData: [
      {
        propertyKey: "prop-key",
        userAgent: { device: "desktop", platformType: "web", browserType: "chrome" },
      },
    ],
    lastInferredLocation: location,
  };

  it("maps a user correctly", () => {
    const [result] = mapUsersToCachedUsers([user]);
    expect(result.iId).toBe("iid-001");
    expect(result.sId).toBe("usr-001");
    expect(result.date).toBe(1_700_000_000_000);
    expect(result.type).toBe("USER");
    expect(result.attrs).toEqual(user.customAttributes);
    expect(result.agent).toEqual(user.lastVisitedUserAgentData);
    expect(result.location).toEqual(location);
  });

  it("defaults agent to empty array when lastVisitedUserAgentData is absent", () => {
    const noAgent: User = { ...user, lastVisitedUserAgentData: undefined };
    const [result] = mapUsersToCachedUsers([noAgent]);
    expect(result.agent).toEqual([]);
  });

  it("returns an empty array when given no users", () => {
    expect(mapUsersToCachedUsers([])).toEqual([]);
  });
});

describe("mapPageViewsToCachedPageViews", () => {
  const pageView: PageView = {
    scheme: "https",
    host: "example.com",
    path: "/dashboard",
    queryString: "tab=overview",
    hash: "section1",
    queryParams: { tab: "overview" },
    remoteHost: "10.0.0.2",
    referrer: "https://example.com/home",
    screenHeight: 900,
    screenWidth: 1440,
    languages: ["en-US"],
    pageTitle: "Dashboard",
    eventId: "evt-pv-001",
    identifyId: "iid-001",
    propertyKey: "prop-key",
    date: 1_700_000_000_000,
    eventType: "PAGE_VIEW",
    sessionId: "sid-001",
    userType: "USER",
    accountId: "acc-001",
    globalContext: [{ key: "value" }],
  };

  it("maps all fields correctly", () => {
    const [result] = mapPageViewsToCachedPageViews([pageView]);
    expect(result.scheme).toBe("https");
    expect(result.host).toBe("example.com");
    expect(result.path).toBe("/dashboard");
    expect(result.queryString).toBe("tab=overview");
    expect(result.hash).toBe("section1");
    expect(result.queryParams).toEqual({ tab: "overview" });
    expect(result.remoteHost).toBe("10.0.0.2");
    expect(result.referrer).toBe("https://example.com/home");
    expect(result.screenHeight).toBe(900);
    expect(result.screenWidth).toBe(1440);
    expect(result.languages).toEqual(["en-US"]);
    expect(result.pageTitle).toBe("Dashboard");
    expect(result.id).toBe("evt-pv-001");       // eventId → id
    expect(result.iId).toBe("iid-001");          // identifyId → iId
    expect(result.propertyKey).toBe("prop-key");
    expect(result.date).toBe(1_700_000_000_000);
    expect(result.eventType).toBe("PAGE_VIEW");
    expect(result.sId).toBe("sid-001");          // sessionId → sId
    expect(result.userType).toBe("USER");
    expect(result.accountId).toBe("acc-001");
    expect(result.globalContext).toEqual([{ key: "value" }]);
  });

  it("returns an empty array when given no page views", () => {
    expect(mapPageViewsToCachedPageViews([])).toEqual([]);
  });
});

describe("mapSessionEventsToCachedSessionEvents", () => {
  const sessionEvent: SessionEvent = {
    eventId: "evt-se-001",
    identifyId: "iid-001",
    propertyKey: "prop-key",
    date: 1_700_000_000_000,
    eventType: "SESSION_STARTED",
    sessionId: "sid-001",
    accountId: "acc-001",
    globalContext: [{ ctx: true }],
    remoteHost: "10.0.0.3",
    inferredLocation: location,
    userType: "VISITOR",
  };

  it("maps all fields correctly", () => {
    const [result] = mapSessionEventsToCachedSessionEvents([sessionEvent]);
    expect(result.id).toBe("evt-se-001");        // eventId → id
    expect(result.iId).toBe("iid-001");          // identifyId → iId
    expect(result.propertyKey).toBe("prop-key");
    expect(result.date).toBe(1_700_000_000_000);
    expect(result.eventType).toBe("SESSION_STARTED");
    expect(result.sId).toBe("sid-001");          // sessionId → sId
    expect(result.aId).toBe("acc-001");          // accountId → aId
    expect(result.globalContext).toEqual([{ ctx: true }]);
    expect(result.remoteHost).toBe("10.0.0.3");
    expect(result.location).toEqual(location);   // inferredLocation → location
    expect(result.userType).toBe("VISITOR");
  });

  it("returns an empty array when given no session events", () => {
    expect(mapSessionEventsToCachedSessionEvents([])).toEqual([]);
  });

  it("maps multiple session events", () => {
    const second: SessionEvent = { ...sessionEvent, eventId: "evt-se-002", identifyId: "iid-002" };
    const result = mapSessionEventsToCachedSessionEvents([sessionEvent, second]);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe("evt-se-002");
    expect(result[1].iId).toBe("iid-002");
  });
});
