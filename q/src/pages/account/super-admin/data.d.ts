export type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export type AdminPageParams = {
  pageNum: number;
  pageSize: number;
  username?: string;
  nickname?: string;
};

export type CreateSuperAdminParams = {
  username: string;
  nickname: string;
  password: string;
  roleId: 1;
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

export type UpdateSuperAdminParams = {
  username: string;
  nickname: string;
  password: string;
  roleId: 1;
  deptId?: number | string;
  areaIds: Array<number | string>;
  menuIds: Array<number | string>;
};

export type SuperAdminVO = {
  id?: number | string;
  userId?: number | string;
  username?: string;
  nickname?: string;
  area?: string;
  manageArea?: string;
  manageAreas?: string[];
  menuIds?: Array<number | string>;
};

export type DataTSuperAdminVO = {
  list?: SuperAdminVO[];
  total?: number;
};

export type PageResultTSuperAdminVO = {
  code?: string;
  data?: DataTSuperAdminVO;
  msg?: string;
};
