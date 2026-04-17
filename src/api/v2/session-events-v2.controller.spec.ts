import { SessionEventsControllerV2 } from "./session-events-v2.controller";
import { CachedSessionEvent } from "../../model/cache-model";

const makeSessionEvent = (
  overrides: Partial<CachedSessionEvent> = {},
): CachedSessionEvent => ({
  id: "se-1",
  iId: "identify-1",
  sId: "session-1",
  aId: "account-1",
  date: new Date("2024-01-15T10:00:00Z").getTime(),
  propertyKey: "APX-12345",
  eventType: "session_started",
  remoteHost: "10.0.0.1",
  location: { countryName: "Germany" } as any,
  userType: "USER",
  globalContext: [],
  ...overrides,
});

describe("SessionEventsControllerV2", () => {
  let controller: SessionEventsControllerV2;
  let mockCache: { queryCache: jest.Mock };

  beforeEach(() => {
    mockCache = { queryCache: jest.fn().mockReturnValue([]) };
    controller = new SessionEventsControllerV2(mockCache as any);
  });

  describe("getSessionsV2 — empty cache", () => {
    it("returns empty array and calls queryCache with correct args", () => {
      const result = controller.getSessionsV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toEqual([]);
      expect(mockCache.queryCache).toHaveBeenCalledWith(
        "2024-01-01",
        "2024-01-02",
        "t1",
      );
    });
  });

  describe("getSessionsV2 — with data", () => {
    beforeEach(() => {
      mockCache.queryCache.mockReturnValue([makeSessionEvent()]);
    });

    it("maps all fields correctly when no projection applied", () => {
      const [result] = controller.getSessionsV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
      );
      expect(result.id).toBe("se-1");
      expect(result.identifyId).toBe("identify-1");
      expect(result.sessionId).toBe("session-1");
      expect(result.accountId).toBe("account-1");
      expect(result.date).toBe("2024-01-15T10:00:00.000Z");
      expect(result.propertyKey).toBe("APX-12345");
      expect(result.eventType).toBe("session_started");
      expect(result.remoteHost).toBe("10.0.0.1");
      expect(result.userType).toBe("USER");
      expect(result.globalContext).toEqual([]);
    });

    it("projects only requested fields, always includes id", () => {
      const [result] = controller.getSessionsV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        undefined,
        "identifyId,userType",
      );
      expect(result.id).toBe("se-1");
      expect(result.identifyId).toBe("identify-1");
      expect(result.userType).toBe("USER");
      expect(result.sessionId).toBeUndefined();
      expect(result.propertyKey).toBeUndefined();
    });

    it("filters by userType using filtrex expression", () => {
      mockCache.queryCache.mockReturnValue([
        makeSessionEvent({ id: "se-a", userType: "USER" }),
        makeSessionEvent({ id: "se-b", userType: "VISITOR" }),
      ]);
      const result = controller.getSessionsV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        'userType == "USER"',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("se-a");
    });

    it("filters by eventType using filtrex expression", () => {
      mockCache.queryCache.mockReturnValue([
        makeSessionEvent({ id: "se-a", eventType: "session_started" }),
        makeSessionEvent({ id: "se-b", eventType: "session_ended" }),
      ]);
      const result = controller.getSessionsV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        'eventType == "session_ended"',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("se-b");
    });

    it("returns empty array when filter matches nothing", () => {
      const result = controller.getSessionsV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        'userType == "LEAD"',
      );
      expect(result).toEqual([]);
    });

    it("returns multiple results when cache has multiple session events", () => {
      mockCache.queryCache.mockReturnValue([
        makeSessionEvent({ id: "se-a" }),
        makeSessionEvent({ id: "se-b" }),
      ]);
      const result = controller.getSessionsV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toHaveLength(2);
    });
  });

  describe("getSessionsV2 — error handling", () => {
    it("returns empty array when queryCache throws", () => {
      mockCache.queryCache.mockImplementation(() => {
        throw new Error("cache failure");
      });
      const result = controller.getSessionsV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toEqual([]);
    });
  });
});
