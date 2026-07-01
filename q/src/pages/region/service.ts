import { request } from '@umijs/max';
import type {
  BuildingDetailVO,
  BuildingFormVO,
  BuildingInfoVO,
  DeviceStatusVO,
  DeviceFormVO,
  PrisonFormVO,
  PrisonVO,
  PrisonInfoVO,
  ProvinceVO,
  ProvinceDetailVO,
  ResultData,
  ResultListProvinceVO,
} from './data.d';

type FloorVO = {
  id: number;
  floorName: string;
  floorNo: number;
  floorDrawing?: string;
};

type FloorFormVO = {
  id: number;
  floorName: string;
  floorNo: number;
  buildingId: number;
  buildingName: string;
  deviceNumber: number;
  floorDrawing?: string;
};

const wrapResult = <T>(result: T | ResultData<T>): ResultData<T> => {
  if (result && typeof result === 'object' && 'data' in result) {
    return result as ResultData<T>;
  }

  return { data: result as T };
};

export async function queryProvinceList(options?: {
  [key: string]: any;
}): Promise<ResultData<ProvinceVO[]>> {
  const result = await request<ResultListProvinceVO | ProvinceVO[]>('/api/v1/province', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(options || {}),
  });

  return wrapResult<ProvinceVO[]>(result as ResultListProvinceVO | ProvinceVO[]);
}

export async function queryProvinceDetail(
  provinceId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<ProvinceDetailVO>> {
  const result = await request<ProvinceDetailVO | ResultData<ProvinceDetailVO>>(
    `/api/v1/province/${provinceId}`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<ProvinceDetailVO>(result);
}

export async function queryProvincePrisons(
  provinceId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<PrisonVO[]>> {
  const result = await request<PrisonVO[] | ResultData<PrisonVO[]>>(
    `/api/v1/province/prisons/${provinceId}`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<PrisonVO[]>(result);
}

export async function createPrison(data: Record<string, any>, options?: { [key: string]: any }) {
  return request('/api/v1/prison', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function queryPrisonForm(
  prisonId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<PrisonFormVO>> {
  const result = await request<PrisonFormVO | ResultData<PrisonFormVO>>(
    `/api/v1/prison/${prisonId}/form`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<PrisonFormVO>(result);
}

export async function updatePrison(
  prisonId: number | string,
  data: PrisonFormVO,
  options?: { [key: string]: any }
) {
  return request(`/api/v1/prison/${prisonId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

export async function deletePrison(prisonId: number | string, options?: { [key: string]: any }) {
  return request(`/api/v1/prison/${prisonId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

export async function queryPrisonInfo(
  prisonId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<PrisonInfoVO>> {
  const result = await request<PrisonInfoVO | ResultData<PrisonInfoVO>>(
    `/api/v1/prison/info/${prisonId}`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<PrisonInfoVO>(result);
}

export async function queryPrisonBuildings(
  prisonId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<BuildingDetailVO[]>> {
  const result = await request<BuildingDetailVO[] | ResultData<BuildingDetailVO[]>>(
    `/api/v1/prison/buidings/${prisonId}`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<BuildingDetailVO[]>(result);
}

export async function queryBuildingInfo(
  buildingId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<BuildingInfoVO>> {
  const result = await request<BuildingInfoVO | ResultData<BuildingInfoVO>>(
    `/api/v1/building/info/${buildingId}`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<BuildingInfoVO>(result);
}

export async function queryBuildingFloors(
  buildingId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<FloorVO[]>> {
  const result = await request<FloorVO[] | ResultData<FloorVO[]>>(
    `/api/v1/building/floor/${buildingId}`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<FloorVO[]>(result);
}

export async function queryBuildingFloorForm(
  floorId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<FloorFormVO>> {
  const result = await request<FloorFormVO | ResultData<FloorFormVO>>(
    `/api/v1/floor/${floorId}/form`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<FloorFormVO>(result);
}

export async function createBuilding(
  data: {
    name: string;
    prisonId: number;
    groundFloorNum?: number;
    undergroundFloorNum?: number;
  },
  options?: { [key: string]: any }
) {
  return request('/api/v1/building', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function queryBuildingForm(
  buildingId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<BuildingFormVO>> {
  const result = await request<BuildingFormVO | ResultData<BuildingFormVO>>(
    `/api/v1/building/${buildingId}/form`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<BuildingFormVO>(result);
}

export async function updateBuilding(
  buildingId: number | string,
  data: BuildingFormVO,
  options?: { [key: string]: any }
) {
  return request(`/api/v1/building/${buildingId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

export async function deleteBuilding(
  buildingId: number | string,
  options?: { [key: string]: any }
) {
  return request(`/api/v1/building/${buildingId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

export async function createFloor(
  data: {
    floorNo: number;
    floorName: string;
    buildingId: number;
    deviceNumber?: number;
    floorDrawing?: string;
  },
  options?: { [key: string]: any }
) {
  return request('/api/v1/floor', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function queryFloorDevicePage(
  params: {
    floorId: number | string;
    pageNum: number;
    pageSize: number;
    name?: string;
  },
  options?: { [key: string]: any }
): Promise<ResultData<any>> {
  const result = await request<any>('/api/v1/device/page/floor', {
    method: 'GET',
    params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(options || {}),
  });

  return wrapResult<any>(result);
}

export async function updateFloorDrawing(
  id: number | string,
  filePath: string,
  options?: { [key: string]: any }
) {
  return request(`/api/v1/floor/updateTFloorDraw/${id}`, {
    method: 'PUT',
    params: { filePath },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(options || {}),
  });
}

export async function updateDeviceXY(
  id: number | string,
  positionX: string,
  positionY: string,
  options?: { [key: string]: any }
) {
  return request(`/api/v1/device/updateTDeviceXY/${id}`, {
    method: 'PUT',
    params: { positionX, positionY },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ...(options || {}),
  });
}

export async function createDevice(
  data: {
    deviceNo: string;
    deviceName: string;
    entireNo: string;
    floorId?: number;
    buildingId?: number;
    prisonId?: number;
    powerOff?: number;
    ipAddress?: string;
    port?: number;
    startTime?: string;
    endTime?: string;
    ch1?: string;
    ch2?: string;
    ch3?: string;
    ch4?: string;
    ch5?: string;
    ch6?: string;
    ch7?: string;
    ch8?: string;
    ch9?: string;
    ch10?: string;
    ch11?: string;
    ch12?: string;
    ch13?: string;
    ch14?: string;
    ch15?: string;
    ch16?: string;
    ch17?: string;
    ch18?: string;
  },
  options?: { [key: string]: any }
) {
  return request('/api/v1/device', {
    method: 'POST',
    data,
    ...(options || {}),
  });
}

export async function queryDeviceForm(
  deviceId: number | string,
  options?: { [key: string]: any }
): Promise<ResultData<DeviceFormVO>> {
  const result = await request<DeviceFormVO | ResultData<DeviceFormVO>>(
    `/api/v1/device/${deviceId}/form`,
    {
      method: 'GET',
      ...(options || {}),
    }
  );

  return wrapResult<DeviceFormVO>(result);
}

export async function updateDevice(
  deviceId: number | string,
  data: {
    id?: number;
    deviceNo?: string;
    deviceName?: string;
    entireNo?: string;
    floorId?: number;
    buildingId?: number;
    prisonId?: number;
    powerOff?: number;
    ipAddress?: string;
    port?: number;
    startTime?: string;
    endTime?: string;
    ch1?: string | number;
    ch2?: string | number;
    ch3?: string | number;
    ch4?: string | number;
    ch5?: string | number;
    ch6?: string | number;
    ch7?: string | number;
    ch8?: string | number;
    ch9?: string | number;
    ch10?: string | number;
    ch11?: string | number;
    ch12?: string | number;
    ch13?: string | number;
    ch14?: string | number;
    ch15?: string | number;
    ch16?: string | number;
    ch17?: string | number;
    ch18?: string | number;
  },
  options?: { [key: string]: any }
) {
  return request(`/api/v1/device/${deviceId}`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

export async function deleteDevice(deviceId: number | string, options?: { [key: string]: any }) {
  return request(`/api/v1/device/${deviceId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

export async function updateDeviceChannels(
  deviceId: number | string,
  data: {
    ch1?: string | number;
    ch2?: string | number;
    ch3?: string | number;
    ch4?: string | number;
    ch5?: string | number;
    ch6?: string | number;
    ch7?: string | number;
    ch8?: string | number;
    ch9?: string | number;
    ch10?: string | number;
    ch11?: string | number;
    ch12?: string | number;
    ch13?: string | number;
    ch14?: string | number;
    ch15?: string | number;
    ch16?: string | number;
    ch17?: string | number;
    ch18?: string | number;
  },
  options?: { [key: string]: any }
) {
  return request(`/api/v1/device/${deviceId}/channels`, {
    method: 'PUT',
    data,
    ...(options || {}),
  });
}

export async function batchSetRfSwitch(
  entireNo: string,
  channels: string,
  state: 0 | 1,
  options?: { [key: string]: any }
): Promise<ResultData<any>> {
  const result = await request<ResultData<any>>('/api/v1/udp/shield/batchSetRfSwitch', {
    method: 'GET',
    params: { entireNo, channels, state },
    ...(options || {}),
  });

  return wrapResult<any>(result);
}

export async function getDeviceStatusByEntireNo(
  entireNo: string,
  options?: { [key: string]: any }
): Promise<ResultData<DeviceStatusVO>> {
  const result = await request<ResultData<DeviceStatusVO>>('/api/v1/udp/shield/getDeviceStatus', {
    method: 'GET',
    params: { entireNo },
    ...(options || {}),
  });

  return wrapResult<DeviceStatusVO>(result);
}

export async function getDeviceInfoByIp(
  devIp: string,
  options?: { [key: string]: any }
): Promise<ResultData<any>> {
  const result = await request<ResultData<any>>('/api/v1/udp/shield/getDeviceInfo', {
    method: 'GET',
    params: { devIp },
    ...(options || {}),
  });

  return wrapResult<any>(result);
}

export async function getDeviceInfoByEntireNo(
  entireNo: string,
  options?: { [key: string]: any }
): Promise<ResultData<any>> {
  const result = await request<ResultData<any>>('/api/v1/udp/shield/getDeviceInfo', {
    method: 'GET',
    params: { entireNo },
    ...(options || {}),
  });

  return wrapResult<any>(result);
}
