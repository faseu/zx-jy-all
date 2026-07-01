export type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export type ProvinceDevicePageParams = {
  provinceId: number | string;
  pageNum: number;
  pageSize: number;
  name?: string;
};

export type PrisonDevicePageParams = {
  prisonId: number | string;
  pageNum: number;
  pageSize: number;
  name?: string;
};

export type BuildingDevicePageParams = {
  buildingId: number | string;
  pageNum: number;
  pageSize: number;
  name?: string;
};

export type DeviceVO = {
  id?: number | string;
  deviceNo?: string;
  deviceName?: string;
  entireNo?: string;
  floorId?: number | string;
  floorName?: string | null;
  buildingId?: number | string;
  buildingName?: string | null;
  prisonId?: number | string;
  prisonName?: string | null;
  powerOff?: number | null;
  powerConfig?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  radio_frequency?: string | null;
  ipAddress?: string | null;
  port?: string | null;
};

export type FloorTreeVO = {
  floorId?: number | string;
  floorName?: string;
  deviceList?: DeviceVO[];
};

export type BuildingTreeVO = {
  buildingId?: number | string;
  buildingName?: string;
  floorList?: FloorTreeVO[];
};

export type PrisonTreeVO = {
  prisonId?: number | string;
  prisonName?: string;
  level?: number;
  buildingList?: BuildingTreeVO[];
};

export type ProvinceTreeVO = {
  provinceId?: number | string;
  provinceName?: string;
  prisonList?: PrisonTreeVO[];
};
