import { ActiveUserControllerV2 } from "./active-users-v2.controller";
import { CachedUser } from "../../model/cache-model";

const makeUser = (overrides: Partial<CachedUser> = {}): CachedUser => ({
  iId: "user-1",
  sId: "session-1",
  date: new Date("2024-01-15T10:00:00Z").getTime(),
  signUpDate: new Date("2023-01-01T00:00:00Z").getTime(),
  email: "user@example.com",
  type: "USER",
  attrs: {
    userRoles: "admin,editor",
    userLanguage: "en",
    domainName: "example.com",
  } as any,
  agent: [
    {
      userAgent: {
        platformType: "desktop",
        browserType: "Chrome",
        device: "Mac",
      },
    } as any,
  ],
  location: { countryName: "Germany" } as any,
  ...overrides,
});

describe("ActiveUserControllerV2", () => {
  let controller: ActiveUserControllerV2;
  let mockCache: { queryCache: jest.Mock };

  beforeEach(() => {
    mockCache = { queryCache: jest.fn().mockReturnValue([]) };
    controller = new ActiveUserControllerV2(mockCache as any);
  });

  describe("getUsersV2 — empty cache", () => {
    it("returns empty array and calls queryCache with correct args", () => {
      const result = controller.getUsersV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toEqual([]);
      expect(mockCache.queryCache).toHaveBeenCalledWith(
        "2024-01-01",
        "2024-01-02",
        "t1",
      );
    });
  });

  describe("getUsersV2 — with data", () => {
    beforeEach(() => {
      mockCache.queryCache.mockReturnValue([makeUser()]);
    });

    it("maps all fields correctly when no projection applied", () => {
      const [result] = controller.getUsersV2("2024-01-01", "2024-01-02", "t1");
      expect(result.id).toBe("user-1");
      expect(result.roles).toEqual(["admin", "editor"]);
      expect(result.country).toBe("Germany");
      expect(result.sessionId).toBe("session-1");
      expect(result.language).toBe("en");
      expect(result.platform).toBe("desktop");
      expect(result.browser).toBe("Chrome");
      expect(result.device).toBe("Mac");
      expect(result.domain).toBe("example.com");
    });

    it("projects only requested fields, always includes id", () => {
      const [result] = controller.getUsersV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        undefined,
        "country,browser",
      );
      expect(result.id).toBe("user-1");
      expect(result.country).toBe("Germany");
      expect(result.browser).toBe("Chrome");
      expect(result.roles).toBeUndefined();
      expect(result.platform).toBeUndefined();
    });

    it("filters by country using filtrex expression", () => {
      mockCache.queryCache.mockReturnValue([
        makeUser({ iId: "u1", location: { countryName: "Germany" } as any }),
        makeUser({ iId: "u2", location: { countryName: "France" } as any }),
      ]);
      const result = controller.getUsersV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        'country == "Germany"',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("u1");
    });

    it("returns empty array when filter matches nothing", () => {
      const result = controller.getUsersV2(
        "2024-01-01",
        "2024-01-02",
        "t1",
        'country == "Mars"',
      );
      expect(result).toEqual([]);
    });

    describe("orderBy", () => {
      beforeEach(() => {
        mockCache.queryCache.mockReturnValue([
          makeUser({ iId: "u1", location: { countryName: "Germany" } as any }),
          makeUser({ iId: "u2", location: { countryName: "Austria" } as any }),
        ]);
      });

      it("sorts ascending by country with 'country:asc'", () => {
        const result = controller.getUsersV2(
          "2024-01-01", "2024-01-02", "t1",
          undefined, undefined, "country:asc",
        );
        expect(result[0].id).toBe("u2"); // Austria < Germany
        expect(result[1].id).toBe("u1");
      });

      it("sorts descending by country with 'country:desc'", () => {
        const result = controller.getUsersV2(
          "2024-01-01", "2024-01-02", "t1",
          undefined, undefined, "country:desc",
        );
        expect(result[0].id).toBe("u1"); // Germany > Austria
      });

      it("defaults to ascending when direction is omitted", () => {
        const result = controller.getUsersV2(
          "2024-01-01", "2024-01-02", "t1",
          undefined, undefined, "country",
        );
        expect(result[0].id).toBe("u2");
      });

      it("handles extra colon segments safely ('country:asc:extra')", () => {
        const result = controller.getUsersV2(
          "2024-01-01", "2024-01-02", "t1",
          undefined, undefined, "country:asc:extra",
        );
        expect(result[0].id).toBe("u2");
      });

      it("preserves original order when orderBy is omitted", () => {
        const result = controller.getUsersV2(
          "2024-01-01", "2024-01-02", "t1",
        );
        expect(result[0].id).toBe("u1");
        expect(result[1].id).toBe("u2");
      });
    });
  });

  describe("getUsersV2 — defaults for missing attrs", () => {
    it("falls back to '-' for missing country and domain", () => {
      mockCache.queryCache.mockReturnValue([
        makeUser({ attrs: undefined as any, location: undefined as any }),
      ]);
      const [result] = controller.getUsersV2("2024-01-01", "2024-01-02", "t1");
      expect(result.country).toBe("-");
      expect(result.domain).toBe("-");
    });

    it("falls back to 'unknown' for missing agent fields", () => {
      mockCache.queryCache.mockReturnValue([makeUser({ agent: [] })]);
      const [result] = controller.getUsersV2("2024-01-01", "2024-01-02", "t1");
      expect(result.platform).toBe("unknown");
      expect(result.browser).toBe("unknown");
      expect(result.device).toBe("unknown");
    });
  });

  describe("getUsersV2 — error handling", () => {
    it("returns empty array when queryCache throws", () => {
      mockCache.queryCache.mockImplementation(() => {
        throw new Error("cache failure");
      });
      const result = controller.getUsersV2("2024-01-01", "2024-01-02", "t1");
      expect(result).toEqual([]);
    });
  });
});
