import { request } from '@umijs/max';
import type {
  AdminPageParams,
  CreateSuperAdminParams,
  DataTSuperAdminVO,
  PageResultTSuperAdminVO,
  ResultData,
  UpdateSuperAdminParams,
  UserFormVO,
} from './data.d';

const wrapResult = <T>(result: T | ResultData<T>): ResultData<T> => {
  if (result && typeof result === 'object' && 'data' in result) {
    return result as ResultData<T>;
  }

  return { data: result as T };
};

export async function queryAdminPage(
  params: AdminPageParams,
  options?: { [key: string]: any },
): Promise<ResultData<DataTSuperAdminVO>> {
  const result = await request<PageResultTSuperAdminVO | DataTSuperAdminVO>(
    '/api/v1/users/page/admin',
    {
      method: 'GET',
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      ...(options || {}),
    },
  );

  return wrapResult<DataTSuperAdminVO>(result as PageResultTSuperAdminVO | DataTSuperAdminVO);
}

export async function createSuperAdmin(
  data: CreateSuperAdminParams,
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

export async function updateSuperAdminArea(
  userId: number | string,
  data: UpdateSuperAdminParams,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/updateUserArea/${userId}`, {
    method: 'PUT',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function updateSuperAdminPermission(
  userId: number | string,
  data: UpdateSuperAdminParams,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/users/updateUserPermission/${userId}`, {
    method: 'PUT',
    skipErrorHandler: true,
    data,
    ...(options || {}),
  });
}

export async function resetSuperAdminPassword(
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

export async function deleteSuperAdmin(userId: number | string, options?: { [key: string]: any }) {
  return request(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    skipErrorHandler: true,
    ...(options || {}),
  });
}
