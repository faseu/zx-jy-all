export type AccountCurrentUser = {
  userId?: number | string;
  username?: string;
  roles?: string[];
  roleIds?: Array<number | string>;
  menuIds?: Array<number | string>;
};

export const FIRST_SUPER_ADMIN_ID = '1';
export const SUPER_ADMIN_ROLE_ID = '1';
export const PROVINCE_ADMIN_ROLE_ID = '2';
export const PRISON_ADMIN_ROLE_ID = '3';

const roleCodeById: Record<string, string> = {
  [SUPER_ADMIN_ROLE_ID]: 'ROOT',
  [PROVINCE_ADMIN_ROLE_ID]: 'ADMIN',
  [PRISON_ADMIN_ROLE_ID]: 'GUEST',
};

const getNormalizedRoles = (user: AccountCurrentUser | undefined) =>
  (user?.roles ?? []).map((item) => String(item).replace(/^ROLE_/, '').toUpperCase());

const hasRole = (user: AccountCurrentUser | undefined, roleId: string) => {
  const hasRoleId = (user?.roleIds ?? []).some((item) => String(item) === roleId);
  const roleCode = roleCodeById[roleId];
  const hasRoleCode = roleCode ? getNormalizedRoles(user).includes(roleCode) : false;

  return hasRoleId || hasRoleCode;
};

export const getTokenCurrentUser = (): AccountCurrentUser | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const token = window.localStorage.getItem('accessToken');
  const payload = token?.split('.')[1];
  if (!payload) {
    return undefined;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalizedPayload)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const claims = JSON.parse(json);
    const roles = ((claims.authorities as string[] | undefined) ?? []).map((role) =>
      role.replace(/^ROLE_/, ''),
    );

    return {
      userId: claims.userId ?? claims.user_id ?? claims.id,
      username: claims.sub ?? claims.username,
      roles,
    };
  } catch {
    return undefined;
  }
};

export const isFirstSuperAdmin = (user: AccountCurrentUser | undefined) =>
  (String(user?.userId ?? '') === FIRST_SUPER_ADMIN_ID ||
    ['admin', 'root'].includes(String(user?.username ?? '').toLowerCase()) ||
    (isSuperAdmin(user) && (user?.menuIds ?? []).length === 0));

export const isSuperAdmin = (user: AccountCurrentUser | undefined) =>
  hasRole(user, SUPER_ADMIN_ROLE_ID);

export const isProvinceAdmin = (user: AccountCurrentUser | undefined) =>
  hasRole(user, PROVINCE_ADMIN_ROLE_ID);

export const isPrisonAdmin = (user: AccountCurrentUser | undefined) =>
  hasRole(user, PRISON_ADMIN_ROLE_ID);

export const canAccessSuperAdminPage = (user: AccountCurrentUser | undefined) =>
  isFirstSuperAdmin(user);

export const canAccessProvinceAdminPage = (user: AccountCurrentUser | undefined) =>
  isFirstSuperAdmin(user) || isSuperAdmin(user);

export const canAccessPrisonAdminPage = (user: AccountCurrentUser | undefined) =>
  isFirstSuperAdmin(user) || isSuperAdmin(user) || isProvinceAdmin(user);

export const getVisibleAccountCards = (user: AccountCurrentUser | undefined) => {
  if (isFirstSuperAdmin(user)) {
    return ['super-admin', 'province-admin', 'prison-admin'];
  }

  if (isSuperAdmin(user)) {
    return ['province-admin', 'prison-admin'];
  }

  if (isProvinceAdmin(user)) {
    return ['prison-admin'];
  }

  if (isPrisonAdmin(user)) {
    return [];
  }

  return [];
};
