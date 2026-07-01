export type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

export type PrisonAdminPageParams = {
  pageNum: number;
  pageSize: number;
  provinceId?: number | string;
  prisonId?: number | string;
  username?: string;
  nickname?: string;
};

export type CreatePrisonAdminParams = {
  username: string;
  nickname: string;
  password: string;
  roleId: 3;
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

export type UpdatePrisonAdminParams = {
  username: string;
  nickname: string;
  password: string;
  roleId: 3;
  deptId?: number | string;
  areaIds: Array<number | string>;
  menuIds: Array<number | string>;
};

export type PrisonAdminVO = {
  id?: number | string;
  userId?: number | string;
  username?: string;
  nickname?: string;
  area?: string;
  manageArea?: string;
  manageAreas?: string[];
};

export type DataTPrisonAdminVO = {
  list?: PrisonAdminVO[];
  total?: number;
};

export type PageResultTPrisonAdminVO = {
  code?: string;
  data?: DataTPrisonAdminVO;
  msg?: string;
};
