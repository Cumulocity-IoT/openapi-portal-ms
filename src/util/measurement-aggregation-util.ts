import { get, groupBy, maxBy, meanBy, sortBy, round } from 'lodash';
import { parseISO, startOfDay, startOfHour } from 'date-fns';
import { IMeasurement } from '@c8y/client';

export interface GroupedMeasurements {
  [key: string]: IMeasurement[]; // Key is the hour in 'YYYY-MM-DDTHH:00:00Z' format
}

function groupMeasurementsByHour(
  measurements: IMeasurement[],
): GroupedMeasurements {
  // Use lodash groupBy and date-fns to group by hour
  return groupBy(measurements, (measurement: IMeasurement) => {
    // Parse the ISO date, round to the start of the hour, and format back to ISO string
    const hourDate = startOfHour(parseISO(measurement.time));
    return hourDate.toISOString();
  });
}

function groupMeasurementsByDay(
  measurements: IMeasurement[],
): GroupedMeasurements {
  // Use lodash groupBy and date-fns to group by day
  return groupBy(measurements, (measurement: IMeasurement) => {
    // Parse the ISO date, round to the start of the day, and format back to 'YYYY-MM-dd'
    const dayDate = startOfDay(parseISO(measurement.time));
    return dayDate.toISOString();
  });
}

function calculatAveragesForGrouping(
  grouped: GroupedMeasurements,
  datapoint: string,
): { time: string; value: number }[] {
  if (!datapoint.includes('.')) {
    throw new Error('Datapoint needs to contain fragment.series!');
  }

  const averages = Object.keys(grouped).map((time) => {
    const measurements = grouped[time];
    const values = measurements.map((m) =>
      get(m, `${datapoint}.value`),
    ) as number[];
    const value = meanBy(values);
    return { time, value: round(value, 2) };
  });
  return averages;
}

export function calculateAverageMaxForLast24Hours(
  data: IMeasurement[],
  datapoint: string,
): { value: number | undefined; time: string } {
  const groupedByHour = groupMeasurementsByHour(data);
  const averages = calculatAveragesForGrouping(groupedByHour, datapoint);
  const max = maxBy(averages, (el) => el.value);
  // console.log(
  //   'Ø Last 24 hours (hourly Ø): [' +
  //     averages.map((a) => a.value) +
  //     '] => max: ' +
  //     max?.value +
  //     ' time: ' +
  //     max.time,
  // );

  return max;
}

export function calculateAverageMaxForLast7Days(
  data: IMeasurement[],
  datapoint: string,
): { value: number | undefined; time: string } {
  const groupedByDay = groupMeasurementsByDay(data);
  const averages = calculatAveragesForGrouping(groupedByDay, datapoint);

  const max = maxBy(averages, (el) => el.value);
  // console.log(
  //   'Ø Last 7 days (daily Ø): [' +
  //     averages.map((a) => a.value) +
  //     '] => max: ' +
  //     max?.value +
  //     ' time: ' +
  //     max.time,
  // );

  return max;
}

export function calculateAverageMaxForLast4Weeks(
  data: IMeasurement[],
  datapoint: string,
): { value: number | undefined; time: string } {
  const groupedByDay = groupMeasurementsByDay(data);
  const averages = calculatAveragesForGrouping(groupedByDay, datapoint);

  const max = maxBy(averages, (el) => el.value);
  // console.log(
  //   'Ø Last 4 weeks (daily Ø): [' +
  //     averages.map((a) => a.value) +
  //     '] => max: ' +
  //     max?.value +
  //     ' time: ' +
  //     max.time,
  // );
  return max;
}

export function calculatePercentile(
  data: IMeasurement[],
  datapoint: string,
  percentile = 90,
): { value: number | undefined; time: string } {
  if (!datapoint.includes('.')) {
    throw new Error('Datapoint needs to contain fragment.series!');
  }

  if (!data.length) {
    return undefined;
  }

  const values = data.map((m) => ({
    value: get(m, `${datapoint}.value`),
    time: get(m, `${datapoint}.time`),
  })) as { value: number | undefined; time: string }[];
  const sortedValues = sortBy(values, 'value');
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  const match = sortedValues[index];
  match.value = round(match.value, 2);
  return match;
}
