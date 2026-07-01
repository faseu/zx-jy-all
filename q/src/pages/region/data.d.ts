export type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export type ProvinceVO = {
  provinceId?: number;
  provinceName?: string;
  totalPrisons?: number;
  totalDevices?: number;
};

export type ProvinceDetailVO = {
  provinceId?: number;
  provinceName?: string;
  totalPrisons?: number;
  totalDevices?: number;
  onlineDevices?: number;
  offlineDevices?: number;
  totalAlarms?: number;
};

export type PrisonVO = {
  id?: number;
  name?: string;
  buildingNum?: number;
  level?: number;
  totalDevices?: number;
};

export type PrisonFormVO = {
  id?: number;
  name?: string;
  roomNumber?: number;
  authUsers?: string;
  level?: number;
  deptId?: number;
  deptName?: string;
  createBy?: number;
  createTime?: string;
  updateBy?: number;
  updateTime?: string;
  isDeleted?: number;
};

export type PrisonInfoVO = {
  id?: number;
  name?: string;
  buildingNum?: number;
  totalDevices?: number;
  onlineDevices?: number;
  offlineDevices?: number;
  totalAlarms?: number;
};

export type BuildingDetailVO = {
  id?: number;
  name?: string;
  floorNum?: number;
  groundFloorNum?: number;
  undergroundFloorNum?: number;
  totalDevices?: number;
};

export type BuildingInfoVO = {
  id?: number;
  name?: string;
  floorNum?: number;
  totalDevices?: number;
  onlineDevices?: number;
  offlineDevices?: number;
  totalAlarms?: number;
};

export type BuildingFormVO = {
  id?: number;
  name?: string;
  floorNum?: number;
  prisonId?: number;
  prisonName?: string;
  createBy?: number;
  createTime?: string;
  updateBy?: number;
  updateTime?: string;
  isDeleted?: number;
  groundFloorNum?: number;
  undergroundFloorNum?: number;
};

export type DeviceFormVO = {
  id?: number;
  deviceNo?: string;
  deviceName?: string;
  entireNo?: string;
  floorName?: string;
  floorId?: number;
  buildingId?: number;
  buildingName?: string;
  prisonId?: number;
  prisonName?: string;
  powerOff?: number;
  powerConfig?: number;
  ipAddress?: string;
  port?: number;
  createBy?: number;
  createTime?: string;
  updateBy?: number;
  updateTime?: string;
  isDeleted?: number;
  parameters?: string;
  startTime?: string;
  endTime?: string;
  positionX?: string;
  positionY?: string;
  voltage?: string;
  electric_current?: string;
  radio_frequency?: string;
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
};

export type DeviceStatusVO = {
  deviceId?: number;
  voltage?: number;
  current?: number;
  temperature?: number;
  channelStates?: number;
  alarmStatus?: number;
  vcoOn?: boolean;
  fanOn?: boolean;
  reportTime?: number;
};

export type ResultListProvinceVO = {
  code?: string;
  data?: ProvinceVO[];
  msg?: string;
};
