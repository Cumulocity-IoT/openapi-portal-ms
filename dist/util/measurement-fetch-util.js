"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datesForLast24Hours = datesForLast24Hours;
exports.datesForLast7Days = datesForLast7Days;
exports.datesForLast4Weeks = datesForLast4Weeks;
const date_fns_1 = require("date-fns");
function datesForLast24Hours() {
    const now = new Date();
    const dateTo = now.toISOString();
    const dateFrom = (0, date_fns_1.sub)(new Date(), { hours: 24 }).toISOString();
    return { dateFrom, dateTo };
}
function datesForLast7Days() {
    const now = new Date();
    const dateTo = now.toISOString();
    const dateFrom = (0, date_fns_1.sub)(new Date(), { days: 7 }).toISOString();
    return { dateFrom, dateTo };
}
function datesForLast4Weeks() {
    const now = new Date();
    const dateTo = now.toISOString();
    const dateFrom = (0, date_fns_1.sub)(new Date(), { weeks: 4 }).toISOString();
    return { dateFrom, dateTo };
}
//# sourceMappingURL=measurement-fetch-util.js.map