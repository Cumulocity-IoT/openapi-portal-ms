import { sub } from "date-fns";

export function datesForLast24Hours() {
  const now = new Date();
  const dateTo = now.toISOString();
  const dateFrom = sub(new Date(), { hours: 24 }).toISOString();
  return { dateFrom, dateTo };
}

export function datesForLast7Days() {
  const now = new Date();
  const dateTo = now.toISOString();
  const dateFrom = sub(new Date(), { days: 7 }).toISOString();
  return { dateFrom, dateTo };
}

export function datesForLast4Weeks() {
  const now = new Date();
  const dateTo = now.toISOString();
  const dateFrom = sub(new Date(), { weeks: 4 }).toISOString();
  return { dateFrom, dateTo };
}
