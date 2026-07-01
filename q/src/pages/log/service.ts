import { request } from '@umijs/max';

export type OperLogRecord = {
  id: number | string;
  createBy?: string;
  loginTime?: string;
  operateTime?: string;
  content?: string;
  actionCode?: string;
  moduleCode?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  provinceId?: number | string;
  prisonId?: number | string;
  prisonLevel?: number | string;
  path?: string;
  requestMethod?: string;
  params?: string;
};

export type OperLogPageParams = {
  pageNum: number;
  pageSize: number;
  provinceId?: number | string;
  prisonLevel?: number | string;
  keywords?: string;
};

export type PageData<T> = {
  list: T[];
  total: number;
};

type ResultData<T> = {
  code?: string;
  data?: T;
  msg?: string;
};

const wrapPage = <T>(result: ResultData<PageData<T>> | PageData<T>): PageData<T> => {
  const data = (
    result && typeof result === 'object' && 'data' in result
      ? result.data
      : result
  ) as PageData<T> | undefined;
  return {
    list: Array.isArray(data?.list) ? data.list : [],
    total: Number(data?.total ?? 0),
  };
};

export async function queryOperLogPage(params: OperLogPageParams): Promise<PageData<OperLogRecord>> {
  const result = await request<ResultData<PageData<OperLogRecord>> | PageData<OperLogRecord>>(
    '/api/v1/operlogs/page',
    {
      method: 'GET',
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return wrapPage<OperLogRecord>(result);
}

export async function recordClientOperation(data: {
  content: string;
  actionCode?: string;
  moduleCode?: string;
  targetType?: string;
  targetId?: number | string;
  targetName?: string;
  path?: string;
  provinceId?: number | string;
  prisonId?: number | string;
  prisonLevel?: number | string;
}) {
  if (!data.content?.trim()) {
    return;
  }

  return request('/api/v1/operlogs/client', {
    method: 'POST',
    data,
  });
}
