import { Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';
import { User } from '../model/gainsight-px.model';

@Injectable()
export class UserUtilityService {
  top50Users(users: User[]) {
    const topUsers = users
      .sort((a, b) => (b.numberOfVisits ?? 0) - (a.numberOfVisits ?? 0))
      .slice(0, 50)
      .map((user) => ({
        id: user.id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        numberOfVisits: user.numberOfVisits,
        lastSeenDate: user.lastSeenDate,
      }));

    return { topUsers };
  }

  numberOfNewSignups(users: User[]) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = subDays(startDate, 30);
    const newSignups = users.filter((user) => new Date(user.signUpDate) >= thirtyDaysAgo);
    return { newSignups: newSignups.length };
  }

  numberOfUsers(users: User[]) {
    return { totalUsers: users.length };
  }

  topLanguages(users: User[]) {
    const counts: Record<string, number> = {};
    users.forEach((user) => {
      const lang = user.customAttributes?.userLanguage || 'unknown';
      if (!counts[lang]) {
        counts[lang] = 0;
      }
      counts[lang]++;
    });
    const total = users.length;
    const languageCounts = Object.entries(counts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    return { languageCounts };
  }

  topUserRoles(users: User[]) {
    const counts: Record<string, number> = {};
    users.forEach((user) => {
      const roleString = user.customAttributes?.userRoles || 'unknown';
      const roles = roleString.split(',').map((r) => r.trim());
      roles.forEach((role) => {
        if (!counts[role]) {
          counts[role] = 0;
        }
        counts[role]++;
      });
    });
    const total = users.length;
    const roleCounts = Object.entries(counts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    return { roleCounts };
  }

  topCountries(users: User[]) {
    const counts: Record<string, number> = {};
    users.forEach((user) => {
      const country = user.lastInferredLocation?.countryName || 'unknown';
      if (!counts[country]) {
        counts[country] = 0;
      }
      counts[country]++;
    });
    const total = users.length;
    const countryCounts = Object.entries(counts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    return { countryCounts };
  }

  topPlatforms(users: User[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const lastVisitedUserAgentData = user.lastVisitedUserAgentData;
      if (!lastVisitedUserAgentData || lastVisitedUserAgentData.length === 0) {
        continue;
      }
      const [first] = lastVisitedUserAgentData;
      const platform = first.userAgent?.platformType || 'unknown';

      if (!counts[platform]) {
        counts[platform] = 0;
      }
      counts[platform]++;
    }
    const total = users.length;
    const platformCounts = Object.entries(counts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    return { platformCounts };
  }

  topBrowsers(users: User[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const lastVisitedUserAgentData = user.lastVisitedUserAgentData;
      if (!lastVisitedUserAgentData || lastVisitedUserAgentData.length === 0) {
        continue;
      }
      const [first] = lastVisitedUserAgentData;
      const browser = first.userAgent?.browserType || 'unknown';

      if (!counts[browser]) {
        counts[browser] = 0;
      }
      counts[browser]++;
    }
    const total = users.length;
    const browserCounts = Object.entries(counts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    return { browserCounts };
  }

  topDeviceTypes(users: User[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const lastVisitedUserAgentData = user.lastVisitedUserAgentData;
      if (!lastVisitedUserAgentData || lastVisitedUserAgentData.length === 0) {
        continue;
      }
      const [first] = lastVisitedUserAgentData;
      const device = first.userAgent?.device || 'unknown';

      if (!counts[device]) {
        counts[device] = 0;
      }
      counts[device]++;
    }
    const total = users.length;
    const deviceCounts = Object.entries(counts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
    return { deviceCounts };
  }
}
