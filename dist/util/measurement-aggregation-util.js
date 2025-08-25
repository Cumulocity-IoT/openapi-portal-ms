"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAverageMaxForLast24Hours = calculateAverageMaxForLast24Hours;
exports.calculateAverageMaxForLast7Days = calculateAverageMaxForLast7Days;
exports.calculateAverageMaxForLast4Weeks = calculateAverageMaxForLast4Weeks;
exports.calculatePercentile = calculatePercentile;
const lodash_1 = require("lodash");
const date_fns_1 = require("date-fns");
function groupMeasurementsByHour(measurements) {
    return (0, lodash_1.groupBy)(measurements, (measurement) => {
        const hourDate = (0, date_fns_1.startOfHour)((0, date_fns_1.parseISO)(measurement.time));
        return hourDate.toISOString();
    });
}
function groupMeasurementsByDay(measurements) {
    return (0, lodash_1.groupBy)(measurements, (measurement) => {
        const dayDate = (0, date_fns_1.startOfDay)((0, date_fns_1.parseISO)(measurement.time));
        return dayDate.toISOString();
    });
}
function calculatAveragesForGrouping(grouped, datapoint) {
    if (!datapoint.includes('.')) {
        throw new Error('Datapoint needs to contain fragment.series!');
    }
    const averages = Object.keys(grouped).map((time) => {
        const measurements = grouped[time];
        const values = measurements.map((m) => (0, lodash_1.get)(m, `${datapoint}.value`));
        const value = (0, lodash_1.meanBy)(values);
        return { time, value: (0, lodash_1.round)(value, 2) };
    });
    return averages;
}
function calculateAverageMaxForLast24Hours(data, datapoint) {
    const groupedByHour = groupMeasurementsByHour(data);
    const averages = calculatAveragesForGrouping(groupedByHour, datapoint);
    const max = (0, lodash_1.maxBy)(averages, (el) => el.value);
    return max;
}
function calculateAverageMaxForLast7Days(data, datapoint) {
    const groupedByDay = groupMeasurementsByDay(data);
    const averages = calculatAveragesForGrouping(groupedByDay, datapoint);
    const max = (0, lodash_1.maxBy)(averages, (el) => el.value);
    return max;
}
function calculateAverageMaxForLast4Weeks(data, datapoint) {
    const groupedByDay = groupMeasurementsByDay(data);
    const averages = calculatAveragesForGrouping(groupedByDay, datapoint);
    const max = (0, lodash_1.maxBy)(averages, (el) => el.value);
    return max;
}
function calculatePercentile(data, datapoint, percentile = 90) {
    if (!datapoint.includes('.')) {
        throw new Error('Datapoint needs to contain fragment.series!');
    }
    if (!data.length) {
        return undefined;
    }
    const values = data.map((m) => ({
        value: (0, lodash_1.get)(m, `${datapoint}.value`),
        time: (0, lodash_1.get)(m, `${datapoint}.time`),
    }));
    const sortedValues = (0, lodash_1.sortBy)(values, 'value');
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    const match = sortedValues[index];
    match.value = (0, lodash_1.round)(match.value, 2);
    return match;
}
//# sourceMappingURL=measurement-aggregation-util.js.map