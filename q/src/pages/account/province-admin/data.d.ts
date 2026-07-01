export type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export type ProvinceAdminPageParams = {
  pageNum: number;
  pageSize: number;
  provinceId?: number | string;
  username?: string;
  nickname?: string;
};

export type CreateProvinceAdminParams = {
  username: string;
  nickname: string;
  password: string;
  roleId: 2;
  deptId: number | string;
  areaIds: Array<number | string>;
  menuIds: Array<number | string>;
};

export type UserFormVO = {
  id?: number | string;
  username?: string;
  nickname?: string;
  password?: string;
  status?: number;
  deptId?: number | string;
  roleId?: number | string;
  areaIds?: Array<number | string>;
  menuIds?: Array<number | string>;
};

export type UpdateProvinceAdminParams = {
  username: string;
  nickname: string;
  password: string;
  roleId: 2;
  deptId?: number | string;
  areaIds: Array<number | string>;
  menuIds: Array<number | string>;
};

export type ProvinceAdminVO = {
  id?: number | string;
  userId?: number | string;
  username?: string;
  nickname?: string;
  deptName?: string;
  area?: string;
  manageArea?: string;
  manageAreas?: string[];
};

export type DataTProvinceAdminVO = {
  list?: ProvinceAdminVO[];
  total?: number;
};

export type PageResultTProvinceAdminVO = {
  code?: string;
  data?: DataTProvinceAdminVO;
  msg?: string;
};
