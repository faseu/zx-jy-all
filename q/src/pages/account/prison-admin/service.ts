import { request } from '@umijs/max';
import type {
  CreatePrisonAdminParams,
  DataTPrisonAdminVO,
  PageResultTPrisonAdminVO,
  PrisonAdminPageParams,
  ResultData,
  UpdatePrisonAdminParams,
  UserFormVO,
} from './data.d';

const wrapResult = <T>(result: T | ResultData<T>): ResultData<T> => {
  if (result && typeof result === 'object' && 'data' in result) {
    return result as ResultData<T>;
  }

  return { data: result as T };
};

export async function queryPrisonAdminPage(
  params: PrisonAdminPageParams,
  options?: { [key: string]: any },
): Promise<ResultData<DataTPrisonAdminVO>> {
  const result = await request<PageResultTPrisonAdminVO | DataTPrisonAdminVO>(
    '/api/v1/users/page/Prison',
    {
      method: 'GET',
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      ...(options || {}),
    },
  );

  return wrapResult<DataTPrisonAdminVO>(result as PageResultTPrisonAdminVO | DataTPrisonAdminVO);
}

export async function createPrisonAdmin(
  data: CreatePrisonAdminParams,
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

export async function updatePrisonAdminArea(
  userId: number | string,
  data: UpdatePrisonAdminParams,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/updateUserArea/${userId}`, {
    method: 'PUT',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function updatePrisonAdminPermission(
  userId: number | string,
  data: UpdatePrisonAdminParams,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/updateUserPermission/${userId}`, {
    method: 'PUT',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function resetPrisonAdminPassword(
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

export async function deletePrisonAdmin(userId: number | string, options?: { [key: string]: any }) {
  return request(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    skipErrorHandler: true,
    ...(options || {}),
  });
}
