import { request } from '@umijs/max';
import type {
  CreateProvinceAdminParams,
  DataTProvinceAdminVO,
  PageResultTProvinceAdminVO,
  ProvinceAdminPageParams,
  ResultData,
  UpdateProvinceAdminParams,
  UserFormVO,
} from './data.d';

const wrapResult = <T>(result: T | ResultData<T>): ResultData<T> => {
  if (result && typeof result === 'object' && 'data' in result) {
    return result as ResultData<T>;
  }

  return { data: result as T };
};

export async function queryProvinceAdminPage(
  params: ProvinceAdminPageParams,
  options?: { [key: string]: any },
): Promise<ResultData<DataTProvinceAdminVO>> {
  const result = await request<PageResultTProvinceAdminVO | DataTProvinceAdminVO>(
    '/api/v1/users/page/province',
    {
      method: 'GET',
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      ...(options || {}),
    },
  );

  return wrapResult<DataTProvinceAdminVO>(result as PageResultTProvinceAdminVO | DataTProvinceAdminVO);
}

export async function createProvinceAdmin(
  data: CreateProvinceAdminParams,
  options?: { [key: string]: any },
) {
  return request('/api/v1/users', {
    method: 'POST',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function queryUserForm(userId: number | string, options?: { [key: string]: any }) {
  return request<ResultData<UserFormVO>>(`/api/v1/users/${userId}/form`, {
    method: 'GET',
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function updateProvinceAdminArea(
  userId: number | string,
  data: UpdateProvinceAdminParams,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/updateUserArea/${userId}`, {
    method: 'PUT',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function updateProvinceAdminPermission(
  userId: number | string,
  data: UpdateProvinceAdminParams,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/updateUserPermission/${userId}`, {
    method: 'PUT',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function resetProvinceAdminPassword(
  userId: number | string,
  password: string,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/${userId}/password/reset`, {
    method: 'PUT',
    params: { password },
    skipErrorHandler: true,
    ...(options || {}),
  });
}

export async function deleteProvinceAdmin(
  userId: number | string,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    skipErrorHandler: true,
    ...(options || {}),
  });
}
