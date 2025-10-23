import { UserUtilityService } from './user-utility.service';

describe('UserUtilityService (empty input)', () => {
  let svc: UserUtilityService;

  beforeEach(() => {
    svc = new UserUtilityService();
  });

  it('top50Users returns empty topUsers for empty array', () => {
    expect(svc.top50Users([])).toEqual({ topUsers: [] });
  });

  it('numberOfNewSignups returns count 0 for empty array', () => {
    expect(svc.numberOfNewSignups([])).toEqual({ count: 0 });
  });

  it('numberOfUsers returns count 0 for empty array', () => {
    expect(svc.numberOfUsers([])).toEqual({ count: 0 });
  });

  it('topLanguages returns empty array for empty array', () => {
    expect(svc.topLanguages([])).toEqual([]);
  });

  it('topUserRoles returns empty array for empty array', () => {
    expect(svc.topUserRoles([])).toEqual([]);
  });

  it('topCountries returns empty array for empty array', () => {
    expect(svc.topCountries([])).toEqual([]);
  });

  it('topPlatforms returns empty array for empty array', () => {
    expect(svc.topPlatforms([])).toEqual([]);
  });

  it('topBrowsers returns empty array for empty array', () => {
    expect(svc.topBrowsers([])).toEqual([]);
  });

  it('topDeviceTypes returns empty array for empty array', () => {
    expect(svc.topDeviceTypes([])).toEqual([]);
  });

  it('mailDomainNames returns empty array for empty array', () => {
    expect(svc.mailDomainNames([])).toEqual([]);
  });
});