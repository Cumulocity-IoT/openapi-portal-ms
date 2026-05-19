import { PageViewControllerV2 } from "./page-view-v2.controller";
import { CachedPageView } from "../../model/cache-model";

const makePageView = (overrides: Partial<CachedPageView> = {}): CachedPageView => ({
  id: "pv-1",
  iId: "identify-1",
  sId: "session-1",
  date: new Date("2024-01-15T10:00:00Z").getTime(),
  scheme: "https",
  host: "app.example.com",
  path: "/dashboard",
  queryString: "tab=overview",
  hash: "",
  queryParams: { tab: "overview" },
  remoteHost: "10.0.0.1",
  referrer: "https://google.com",
  screenHeight: 900,
  screenWidth: 1440,
  languages: ["en-US", "en"],
  pageTitle: "Dashboard",
  propertyKey: "APX-12345",
  eventType: "pageView",
  userType: "USER",
  accountId: "acct-1",
  globalContext: [],
  ...overrides,
});

describe("PageViewControllerV2", () => {
  let controller: PageViewControllerV2;
  let mockCache: { queryCache: jest.Mock };

  beforeEach(() => {
    mockCache = { queryCache: jest.fn().mockReturnValue([]) };
    controller = new PageViewControllerV2(mockCache as any);
  });

  describe("getPageViewsV2 — empty cache", () => {
    it("returns empty array and calls queryCache with correct args", () => {
      const result = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toEqual([]);
      expect(mockCache.queryCache).toHaveBeenCalledWith("2024-01-01", "2024-01-02", "t1");
    });
  });

  describe("getPageViewsV2 — with data", () => {
    beforeEach(() => {
      mockCache.queryCache.mockReturnValue([makePageView()]);
    });

    it("maps all fields correctly when no projection applied", () => {
      const [result] = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1");
      expect(result.id).toBe("pv-1");
      expect(result.identifyId).toBe("identify-1");
      expect(result.sessionId).toBe("session-1");
      expect(result.date).toBe("2024-01-15T10:00:00.000Z");
      expect(result.host).toBe("app.example.com");
      expect(result.path).toBe("/dashboard");
      expect(result.pageTitle).toBe("Dashboard");
      expect(result.userType).toBe("USER");
      expect(result.accountId).toBe("acct-1");
    });

    it("projects only requested fields, always includes id", () => {
      const [result] = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1", undefined, "host,path");
      expect(result.id).toBe("pv-1");
      expect(result.host).toBe("app.example.com");
      expect(result.path).toBe("/dashboard");
      expect(result.pageTitle).toBeUndefined();
      expect(result.userType).toBeUndefined();
    });

    it("filters by host using filtrex expression", () => {
      mockCache.queryCache.mockReturnValue([makePageView({ id: "pv-a", host: "app.example.com" }), makePageView({ id: "pv-b", host: "other.example.com" })]);
      const result = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1", 'host == "app.example.com"');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pv-a");
    });

    it("filters by path using filtrex expression", () => {
      mockCache.queryCache.mockReturnValue([makePageView({ id: "pv-a", path: "/dashboard" }), makePageView({ id: "pv-b", path: "/settings" })]);
      const result = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1", 'path == "/settings"');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("pv-b");
    });

    it("returns empty array when filter matches nothing", () => {
      const result = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1", 'path == "/nonexistent"');
      expect(result).toEqual([]);
    });

    it("returns multiple results when cache has multiple page views", () => {
      mockCache.queryCache.mockReturnValue([makePageView({ id: "pv-a" }), makePageView({ id: "pv-b" }), makePageView({ id: "pv-c" })]);
      const result = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toHaveLength(3);
    });

    describe("orderBy", () => {
      beforeEach(() => {
        mockCache.queryCache.mockReturnValue([makePageView({ id: "pv-a", iId: "user-b" }), makePageView({ id: "pv-b", iId: "user-a" })]);
      });

      it("sorts ascending by identifyId with 'identifyId:asc'", () => {
        const result = controller.getPageViewsV2("2024-01-01", "2024-02-01", "t1", undefined, undefined, "identifyId:asc");
        expect(result[0].id).toBe("pv-b");
        expect(result[1].id).toBe("pv-a");
      });

      it("sorts descending by identifyId with 'identifyId:desc'", () => {
        const result = controller.getPageViewsV2("2024-01-01", "2024-02-01", "t1", undefined, undefined, "identifyId:desc");
        expect(result[0].id).toBe("pv-a");
        expect(result[1].id).toBe("pv-b");
      });

      it("defaults to ascending when direction is omitted ('identifyId')", () => {
        const result = controller.getPageViewsV2("2024-01-01", "2024-02-01", "t1", undefined, undefined, "identifyId");
        expect(result[0].id).toBe("pv-b");
      });

      it("handles extra colon segments safely ('identifyId:desc:extra')", () => {
        const result = controller.getPageViewsV2("2024-01-01", "2024-02-01", "t1", undefined, undefined, "identifyId:desc:extra");
        expect(result[0].id).toBe("pv-a");
      });

      it("preserves original order when orderBy is omitted", () => {
        const result = controller.getPageViewsV2("2024-01-01", "2024-02-01", "t1");
        expect(result[0].id).toBe("pv-a");
        expect(result[1].id).toBe("pv-b");
      });
    });
  });

  describe("getPageViewsV2 — error handling", () => {
    it("returns empty array when queryCache throws", () => {
      mockCache.queryCache.mockImplementation(() => {
        throw new Error("cache failure");
      });
      const result = controller.getPageViewsV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toEqual([]);
    });
  });
});
