import { EventsController } from './custom-events.controller';

describe('EventsController (empty cache)', () => {
  let controller: EventsController;
  let mockCache: any;

  beforeEach(() => {
    mockCache = {
      queryCache: jest.fn().mockResolvedValue([]),
    };
    controller = new EventsController(mockCache);
  });

  it('getEventCounts returns empty array when cache is empty', async () => {
    const res = await controller.getEventCounts();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(mockCache.queryCache).toHaveBeenCalled();
  });

  it('getEventCountsByName (widgetsByName) returns empty array when cache is empty', async () => {
    const res = await controller.getEventCountsByName('someEvent', '2020-01-01', '2020-01-02');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
    expect(mockCache.queryCache).toHaveBeenCalled();
  });

  it('filteredByProjectName returns empty array for empty input', () => {
    const res = (controller as any).filteredByProjectName([], 'devicemanagement');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  it('aggregateEventCountsBy returns empty array for empty input', () => {
    const res = (controller as any).aggregateEventCountsBy([], 'eventName');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });
});