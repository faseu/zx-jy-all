export type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export type AlarmPageParams = {
  pageNum: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  deviceName?: string;
  type?: string;
  processingStatus?: number;
  blocked?: number;
  provinceId?: number | string;
  prisonId?: number | string;
  buildingId?: number | string;
  floorId?: number | string;
};

export type UpdateAlarmParams = {
  id: number | string;
  entireNo: string;
  deviceId: number | string;
  deviceName: string;
  processingStatus?: number;
  resolutionTime?: string;
  blocked?: number;
};

export type AlarmVO = {
  id?: number | string;
  entireNo?: string;
  deviceId?: number | string;
  deviceName?: string;
  prisonId?: number | string;
  prisonName?: string | null;
  buildingId?: number | string | null;
  buildingName?: string | null;
  floorId?: number | string | null;
  floorName?: string | null;
  content?: string;
  type?: string;
  alarmTime?: string;
  suggestions?: string;
  processingStatus?: number;
  resolutionTime?: string;
  blocked?: number;
  createBy?: number;
  createTime?: string;
  updateBy?: number;
  updateTime?: string;
  isDeleted?: number;
};

export type DataTAlarmVO = {
  list?: AlarmVO[];
  total?: number;
};

export type PageResultTAlarmVO = {
  code?: string;
  data?: DataTAlarmVO;
  msg?: string;
};
