import { EventsController } from "./custom-events.controller";
import { FilterService } from "../service/filter.service";

describe("EventsController (empty cache)", () => {
  let controller: EventsController;
  let mockCache: any;
  let filterService: FilterService;

  beforeEach(() => {
    mockCache = {
      queryCache: jest.fn().mockReturnValue([]),
    };
    filterService = new FilterService();
    controller = new EventsController(mockCache, filterService);
  });

  it("getEventCountsByName (widgetsByName) returns empty array when cache is empty", async () => {
    const res = await controller.getEventCountsByName(
      "someEvent",
      "2020-01-01",
      "2020-01-02",
      "t1234",
    );
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(mockCache.queryCache).toHaveBeenCalled();
  });

  // it('filteredByProjectName returns empty array for empty input', () => {
  //   const res = (controller as any).filteredByProjectName([], 'devicemanagement');
  //   expect(Array.isArray(res)).toBe(true);
  //   expect(res.length).toBe(0);
  // });

  it("aggregateEventCountsBy returns empty array for empty input", () => {
    const res = (controller as any).aggregateEventCountsBy([], "eventName");
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it("getEventsV2 applies filter parameter", () => {
    const events = [
      {
        name: "click",
        data: { widgetName: "w1" },
        date: "2020-01-01T00:00:00Z",
      },
      {
        name: "view",
        data: { widgetName: "w2" },
        date: "2020-01-01T01:00:00Z",
      },
    ];
    mockCache.queryCache.mockReturnValue(events);
    const res = controller.getEventsV2(
      "2020-01-01",
      "2020-01-02",
      "t1234",
      'name == "click"',
      undefined,
    );
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(1);
    expect(res[0].name).toBe("click");
  });

  it("getEventsV2 applies fields parameter", () => {
    const events = [
      { name: "event1", data: { a: 1, b: 2 }, date: "2020-01-01T00:00:00Z" },
    ];
    mockCache.queryCache.mockReturnValue(events);
    const res = controller.getEventsV2(
      "2020-01-01",
      "2020-01-02",
      "t1234",
      undefined,
      "a",
    );
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(1);
    expect(res[0].name).toBe("event1");
    expect(res[0].a).toBe(1);
    expect(res[0].b).toBeUndefined();
  });

  it("getEventsV2 applies filter and fields together", () => {
    const events = [
      { name: "click", data: { a: 1, b: 2 }, date: "2020-01-01T00:00:00Z" },
      { name: "click", data: { a: 3, b: 4 }, date: "2020-01-01T01:00:00Z" },
      { name: "view", data: { a: 5 }, date: "2020-01-01T02:00:00Z" },
    ];
    mockCache.queryCache.mockReturnValue(events);
    const res = controller.getEventsV2(
      "2020-01-01",
      "2020-01-03",
      "t1234",
      'name == "click"',
      "a",
    );
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(2);
    expect(res.every((r) => r.name === "click")).toBe(true);
    expect(res[0].a).toBeDefined();
    expect(res[0].b).toBeUndefined();
  });

  it("getEventsV2 with undefined filter and fields returns base fields only", () => {
    const events = [
      { name: "eventX", data: { x: 10 }, date: "2020-01-01T00:00:00Z" },
    ];
    mockCache.queryCache.mockReturnValue(events);
    const res = controller.getEventsV2("2020-01-01", "2020-01-02", "t1234");
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(1);
    expect(res[0].name).toBe("eventX");
    expect(res[0].date).toBeDefined();
    expect(res[0].x).toBe(10);
    expect(res[0].data).toBeUndefined();
  });
});
