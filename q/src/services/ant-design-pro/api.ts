// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 鑾峰彇褰撳墠鐨勭敤鎴?GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 閫€鍑虹櫥褰曟帴鍙?POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/login/outLogin', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 鐧诲綍鎺ュ彛 POST /api/login/account */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  const form = new URLSearchParams();
  Object.entries(body ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) form.append(k, String(v));
  });

  return request<API.LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    data: form.toString(),
    ...(options || {}),
  });
}

/** 鑾峰彇楠岃瘉鐮 GET /api/v1/auth/captcha */
export async function getCaptcha(options?: { [key: string]: any }) {
  return request<API.CaptchaResult>('/api/v1/auth/captcha', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 姝ゅ鍚庣娌℃湁鎻愪緵娉ㄩ噴 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 鑾峰彇瑙勫垯鍒楄〃 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 褰撳墠鐨勯〉鐮?*/
    current?: number;
    /** 椤甸潰鐨勫閲?*/
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 鏇存柊瑙勫垯 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 鏂板缓瑙勫垯 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 鍒犻櫎瑙勫垯 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}
