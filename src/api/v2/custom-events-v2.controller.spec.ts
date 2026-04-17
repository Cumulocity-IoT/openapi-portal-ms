import { EventsControllerV2 } from "./custom-events-v2.controller";
import { CachedEvent } from "../../model/cache-model";

const makeCachedEvent = (overrides: Partial<CachedEvent> = {}): CachedEvent => ({
  name: "buttonClick",
  data: { widgetName: "myWidget", attributes: { size: "large" } },
  date: new Date("2024-01-15T10:00:00Z").getTime(),
  iId: "identify-1",
  sId: "session-1",
  ...overrides,
});

const makeCustomerEvent = (
  name: `customEvent${string}` = "customEventButtonClick",
  overrides: Partial<CachedEvent> = {},
): CachedEvent => ({
  name,
  data: {
    action_type: "track",
    category: "ui",
    label: "submit-btn",
    metadata: { size: "large", widgetId: "w-1" },
  },
  date: new Date("2024-01-15T10:00:00Z").getTime(),
  iId: "identify-1",
  sId: "session-1",
  ...overrides,
});

describe("EventsControllerV2", () => {
  let controller: EventsControllerV2;
  let mockCache: { queryCache: jest.Mock };

  beforeEach(() => {
    mockCache = { queryCache: jest.fn().mockReturnValue([]) };
    controller = new EventsControllerV2(mockCache as any);
  });

  // ---------------------------------------------------------------------------
  // getEventsV2
  // ---------------------------------------------------------------------------
  describe("getEventsV2", () => {
    describe("empty cache", () => {
      it("returns empty array and calls queryCache with correct args", () => {
        const result = controller.getEventsV2("2024-01-01", "2024-01-02", "t1");
        expect(result).toEqual([]);
        expect(mockCache.queryCache).toHaveBeenCalledWith(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
      });
    });

    describe("with data", () => {
      beforeEach(() => {
        mockCache.queryCache.mockReturnValue([makeCachedEvent()]);
      });

      it("maps all fields correctly when no projection applied", () => {
        const [result] = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result.name).toBe("buttonClick");
        expect(result.date).toBe("2024-01-15T10:00:00.000Z");
        expect(result.data).toEqual({ widgetName: "myWidget", attributes: { size: "large" } });
      });

      it("projects only requested top-level fields, always includes name", () => {
        const [result] = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          undefined,
          "name,date",
        );
        expect(result.name).toBe("buttonClick");
        expect(result.date).toBe("2024-01-15T10:00:00.000Z");
        expect(result.identifyId).toBeUndefined();
        expect(result.sessionId).toBeUndefined();
      });

      it("projects only requested dataFields from event.data", () => {
        const [result] = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          undefined,
          undefined,
          "widgetName",
        );
        expect(result.data).toEqual({ widgetName: "myWidget" });
        expect((result.data as any).attributes).toBeUndefined();
      });

      it("filters events by name using filtrex expression", () => {
        mockCache.queryCache.mockReturnValue([
          makeCachedEvent({ name: "buttonClick", iId: "u1" }),
          makeCachedEvent({ name: "pageView", iId: "u2" }),
        ]);
        const result = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          'name == "buttonClick"',
        );
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("buttonClick");
      });

      it("returns empty array when filter matches nothing", () => {
        const result = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          'name == "nonexistentEvent"',
        );
        expect(result).toEqual([]);
      });

      it("returns multiple results for multiple cached events", () => {
        mockCache.queryCache.mockReturnValue([
          makeCachedEvent({ name: "click" }),
          makeCachedEvent({ name: "hover" }),
          makeCachedEvent({ name: "focus" }),
        ]);
        const result = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result).toHaveLength(3);
      });
    });

    describe("error handling", () => {
      it("returns empty array when queryCache throws", () => {
        mockCache.queryCache.mockImplementation(() => {
          throw new Error("cache failure");
        });
        const result = controller.getEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result).toEqual([]);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getCustomerEventsV2
  // ---------------------------------------------------------------------------
  describe("getCustomerEventsV2", () => {
    describe("empty cache", () => {
      it("returns empty array and calls queryCache with correct args", () => {
        const result = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result).toEqual([]);
        expect(mockCache.queryCache).toHaveBeenCalledWith(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
      });
    });

    describe("pre-filtering to customEvent* names", () => {
      it("excludes events whose name does not start with 'customEvent'", () => {
        mockCache.queryCache.mockReturnValue([
          makeCustomerEvent("customEventButtonClick"),
          makeCachedEvent({ name: "pageView" }),
        ]);
        const result = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("customEventButtonClick");
      });

      it("excludes events that start with 'customEvent' but lack required data fields", () => {
        mockCache.queryCache.mockReturnValue([
          makeCustomerEvent("customEventButtonClick"),
          { name: "customEventBad", data: { foo: "bar" }, date: 0, iId: "x", sId: "y" },
        ]);
        const result = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("customEventButtonClick");
      });
    });

    describe("with valid customer events", () => {
      beforeEach(() => {
        mockCache.queryCache.mockReturnValue([makeCustomerEvent()]);
      });

      it("maps all fields correctly when no projection applied", () => {
        const [result] = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result.name).toBe("customEventButtonClick");
        expect(result.date).toBe("2024-01-15T10:00:00.000Z");
        expect(result.data).toEqual({
          action_type: "track",
          category: "ui",
          label: "submit-btn",
          metadata: { size: "large", widgetId: "w-1" },
        });
      });

      it("projects only requested dataFields from event.data", () => {
        const [result] = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          undefined,
          undefined,
          "category,label",
        );
        expect(result.data).toEqual({ category: "ui", label: "submit-btn" });
        expect((result.data as any).action_type).toBeUndefined();
        expect((result.data as any).metadata).toBeUndefined();
      });

      it("projects only requested top-level fields, always includes name", () => {
        const [result] = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          undefined,
          "name,date",
        );
        expect(result.name).toBe("customEventButtonClick");
        expect(result.date).toBe("2024-01-15T10:00:00.000Z");
        expect(result.identifyId).toBeUndefined();
        expect(result.sessionId).toBeUndefined();
      });

      it("filters customer events using filtrex expression on name", () => {
        mockCache.queryCache.mockReturnValue([
          makeCustomerEvent("customEventButtonClick"),
          makeCustomerEvent("customEventPageLoad"),
        ]);
        const result = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          'name == "customEventPageLoad"',
        );
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("customEventPageLoad");
      });

      it("returns empty array when filter matches nothing", () => {
        const result = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
          'name == "customEventNonExistent"',
        );
        expect(result).toEqual([]);
      });
    });

    describe("error handling", () => {
      it("returns empty array when queryCache throws", () => {
        mockCache.queryCache.mockImplementation(() => {
          throw new Error("cache failure");
        });
        const result = controller.getCustomerEventsV2(
          "2024-01-01",
          "2024-01-02",
          "t1",
        );
        expect(result).toEqual([]);
      });
    });
  });
});
