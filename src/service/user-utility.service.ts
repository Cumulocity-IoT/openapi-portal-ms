import { Injectable } from "@nestjs/common";
import { CachedUser } from "../model/cache-model";

@Injectable()
export class UserUtilityService {
  numberOfNewSignups(users: CachedUser[], startDate: string) {
    const start = new Date(startDate).getTime();
    const newSignups = users.filter((user) => user.signUpDate >= start);
    return { count: newSignups.length };
  }

  numberOfUsers(users: CachedUser[]) {
    return { count: users.length };
  }

  topLanguages(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const lang = user.attrs?.userLanguage || "unknown";
      counts[lang] = (counts[lang] ?? 0) + 1;
    }
    const total = users.length;
    const languageCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return languageCounts;
  }

  topUserRoles(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    let allRolesCount = 0;
    for (const user of users) {
      const roleString = user.attrs?.userRoles || "unknown";
      const roles = roleString.split(",").map((r) => r.trim());
      for (const role of roles) {
        counts[role] = (counts[role] ?? 0) + 1;
        allRolesCount++;
      }
    }

    const roleCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage:
          allRolesCount > 0
            ? Math.round((count / allRolesCount) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return roleCounts;
  }

  topCountries(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const country = user.location?.countryName || "unknown";
      counts[country] = (counts[country] ?? 0) + 1;
    }
    const total = users.length;
    const countryCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return countryCounts;
  }

  topPlatforms(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const agent = user.agent;
      if (!agent || agent.length === 0) {
        continue;
      }
      const [first] = agent;
      const platform = first.userAgent?.platformType || "unknown";
      counts[platform] = (counts[platform] ?? 0) + 1;
    }
    const total = users.length;
    const platformCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return platformCounts;
  }

  topBrowsers(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const agent = user.agent;
      if (!agent || agent.length === 0) {
        continue;
      }
      const [first] = agent;
      const browser = first.userAgent?.browserType || "unknown";
      counts[browser] = (counts[browser] ?? 0) + 1;
    }
    const total = users.length;
    const browserCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return browserCounts;
  }

  topDeviceTypes(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    for (const user of users) {
      const agent = user.agent;
      if (!agent || agent.length === 0) {
        continue;
      }
      const [first] = agent;
      const device = first.userAgent?.device || "unknown";
      counts[device] = (counts[device] ?? 0) + 1;
    }
    const total = users.length;
    const deviceCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return deviceCounts;
  }

  mailDomainNames(users: CachedUser[]) {
    const counts: Record<string, number> = {};
    const usersWithDomain = users.filter((u) => u.email?.includes("@"));
    for (const user of usersWithDomain) {
      const domain = user.email.split("@")[1];
      counts[domain] = (counts[domain] ?? 0) + 1;
    }
    const total = usersWithDomain.length;
    const mailCounts = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
    return mailCounts;
  }
}
