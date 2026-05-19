import { SessionEventsController } from "./session-events.controller";

describe("SessionEventsController.prepopulateDates (edge cases)", () => {
  let controller: SessionEventsController;

  beforeEach(() => {
    controller = new SessionEventsController({} as any);
  });

  it("DAY timeframe with identical start and end returns single midnight bucket", () => {
    const start = new Date("2025-11-01T10:20:30Z");
    const end = new Date("2025-11-01T10:20:30Z");

    const map = (controller as any).prepopulateDates(start, end, "DAY");
    const keys = Object.keys(map).sort();

    const expected = new Date(start);
    expected.setHours(0, 0, 0, 0);

    expect(keys.length).toBe(1);
    expect(keys[0]).toBe(expected.toISOString());
    expect(map[keys[0]]).toBe(0);
  });

  it("HOUR timeframe spanning multiple hours prepopulates each hour bucket inclusive", () => {
    const start = new Date("2025-11-01T10:15:00Z");
    const end = new Date("2025-11-01T12:45:00Z");

    const map = (controller as any).prepopulateDates(start, end, "HOUR");
    const keys = Object.keys(map).sort();

    const normalizeHour = (d: Date) => {
      const n = new Date(d);
      n.setMinutes(0, 0, 0);
      return n;
    };

    const normStart = normalizeHour(start);
    const normEnd = normalizeHour(end);

    // count expected hours inclusive
    let expectedHours = 0;
    for (let cur = new Date(normStart); cur <= normEnd; cur.setHours(cur.getHours() + 1)) {
      expectedHours++;
    }

    expect(keys.length).toBe(expectedHours);
    expect(keys[0]).toBe(normStart.toISOString());
    expect(keys[keys.length - 1]).toBe(normEnd.toISOString());
    keys.forEach((k) => expect(map[k]).toBe(0));
  });

  it("MINUTE timeframe spanning minutes prepopulates each minute bucket inclusive", () => {
    const start = new Date("2025-11-01T10:15:20Z");
    const end = new Date("2025-11-01T10:17:45Z");

    const map = (controller as any).prepopulateDates(start, end, "MINUTE");
    const keys = Object.keys(map).sort();

    const normalizeMinute = (d: Date) => {
      const n = new Date(d);
      n.setSeconds(0, 0);
      return n;
    };

    const normStart = normalizeMinute(start);
    const normEnd = normalizeMinute(end);

    let expectedMinutes = 0;
    for (let cur = new Date(normStart); cur <= normEnd; cur.setMinutes(cur.getMinutes() + 1)) {
      expectedMinutes++;
    }

    expect(keys.length).toBe(expectedMinutes);
    expect(keys[0]).toBe(normStart.toISOString());
    expect(keys[keys.length - 1]).toBe(normEnd.toISOString());
    keys.forEach((k) => expect(map[k]).toBe(0));
  });

  it("returns single minute bucket when start is only seconds before end", () => {
    const start = new Date("2025-11-01T10:00:00Z");
    const end = new Date("2025-11-01T10:00:05Z");

    const map = (controller as any).prepopulateDates(start, end, "MINUTE");
    const keys = Object.keys(map).sort();

    const expected = new Date(start);
    expected.setSeconds(0, 0);

    expect(keys.length).toBe(1);
    expect(keys[0]).toBe(expected.toISOString());
    expect(map[keys[0]]).toBe(0);
  });

  it("returns single minute bucket when start equals end", () => {
    const start = new Date("2025-11-01T10:00:30Z");
    const end = new Date("2025-11-01T10:00:30Z");

    const map = (controller as any).prepopulateDates(start, end, "MINUTE");
    const keys = Object.keys(map).sort();

    const expected = new Date(start);
    expected.setSeconds(0, 0);

    expect(keys.length).toBe(1);
    expect(keys[0]).toBe(expected.toISOString());
    expect(map[keys[0]]).toBe(0);
  });

  it("returns empty map when start is after end", () => {
    const start = new Date("2025-11-01T10:00:10Z");
    const end = new Date("2025-11-01T10:00:05Z");

    const map = (controller as any).prepopulateDates(start, end, "MINUTE");
    expect(Object.keys(map).length).toBe(0);
  });
});
