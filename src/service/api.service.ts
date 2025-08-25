import { Injectable } from '@nestjs/common';
import {
  Client,
  IIdentified,
  IManagedObject,
  IMeasurement,
  ITenantOption,
} from '@c8y/client';
import { uniqBy } from 'lodash';

const VENTINGWELL_GROUP_ID = '44699660';
const BOREHOLE_GROUP_ID = '95699833';

@Injectable()
export class APIService {
  client: Client;

  fetchOrbDevices(): Promise<Array<IManagedObject>> {
    return Promise.all([this.fetchBoreholes(), this.fetchVentingWells()]).then(
      (res) => uniqBy([...res[0], ...res[1]], 'id'),
    );
  }

  updateDevice(device: IIdentified, update: any) {
    return this.client.inventory.update({
      id: device.id,
      ...update,
    });
    // console.log('Update!', device.name, update);
  }

  private fetchBoreholes(): Promise<IManagedObject[]> {
    return this.client.inventory
      .list({
        pageSize: 2000,
        query: `bygroupid(${BOREHOLE_GROUP_ID})`,
      })
      .then((response) => {
        if (response.data?.length) {
          return response.data;
        } else {
          throw new Error(
            `Empty bore hole group or not existing with id ${BOREHOLE_GROUP_ID}`,
          );
        }
      })
      .catch(() => {
        return this.client.inventory
          .list({
            pageSize: 1,
            query: `name eq 'Bore Holes'`,
          })
          .then((res) => {
            const id = res.data[0]?.id;
            return this.client.inventory
              .list({
                pageSize: 2000,
                query: `bygroupid(${id})`,
              })
              .then((res) => res.data);
          });
      });
  }

  private fetchVentingWells(): Promise<IManagedObject[]> {
    return this.client.inventory
      .list({
        pageSize: 2000,
        query: `bygroupid(${VENTINGWELL_GROUP_ID})`,
      })
      .then((response) => {
        if (response.data?.length) {
          return response.data;
        } else {
          throw new Error(
            `Empty venting well group or not existing with id ${VENTINGWELL_GROUP_ID}`,
          );
        }
      })
      .catch(() => {
        return this.client.inventory
          .list({
            pageSize: 1,
            withTotalPages: false,
            query: `name eq 'Venting Well'`,
          })
          .then((res) => {
            const id = res.data[0]?.id;
            return this.client.inventory
              .list({
                pageSize: 2000,
                query: `bygroupid(${id})`,
              })
              .then((res) => res.data);
          });
      });
  }

  async fetchMeasurements(
    dates: { dateFrom: string; dateTo: string },
    source: string,
    datapoint: string,
  ) {
    const [valueFragmentType, valueFragmentSeries] = datapoint.split('.');
    const data = await this.fetchAllMeasurements(this.client, {
      ...dates,
      source,
      valueFragmentType,
      valueFragmentSeries,
      pageSize: 2000,
    });
    return data;
  }

  async fetchLatestMeasurement(
    datapoint: string,
    source: string,
  ): Promise<IMeasurement | undefined> {
    const [valueFragmentType, valueFragmentSeries] = datapoint.split('.');

    const { data } = await this.client.measurement.list({
      source,
      dateFrom: '1970-01-01',
      dateTo: new Date().toISOString(),
      revert: true,
      valueFragmentType,
      valueFragmentSeries,
      pageSize: 1,
      withTotalPages: false,
    });
    if (data.length === 1) {
      return data[0];
    }
    return undefined;
  }

  async fetchAllMeasurements(client: Client, filter: object, MAX_PAGES = 5) {
    try {
      const mos: IMeasurement[] = [];
      let res = await client.measurement.list({
        ...filter,
        withTotalPages: true,
      });
      while (res.data.length) {
        mos.push(...res.data);
        if (!res.paging?.nextPage) {
          break;
        }
        if (res.paging?.nextPage > MAX_PAGES) {
          console.error(
            `MAX_PAGES (${MAX_PAGES}) exceeded (${res.paging?.totalPages}): list measurements (${JSON.stringify(filter)})`,
          );
          break;
        }
        res = await res.paging.next();
      }
      return mos;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async fetchSupportedSeries(device: IManagedObject) {
    return this.client.inventory.getSupportedSeries(device);
  }

  
}
