import { GlobalOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { getLocale, history, request as umiRequest, setLocale, useIntl, useRequest } from '@umijs/max';
import { Button, Dropdown, Form, Input, Modal, Tooltip, message } from 'antd';
import React, { useEffect, useState } from 'react';
import BrandingSettingsModal from '@/components/BrandingSettingsModal';
import { pickBrandingText, queryBrandingConfig } from '@/services/branding';
import {
  getActionCodeByText,
  getModuleCodeByPath,
  shouldRecordClientAction,
} from '@/pages/log/dictionaries';
import { recordClientOperation } from '@/pages/log/service';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;

const NAV_TABS = [
  { path: '/region', labelId: 'app.topNav.region' },
  { path: '/account', labelId: 'app.topNav.account' },
  { path: '/machine', labelId: 'app.topNav.machine' },
  { path: '/alarm', labelId: 'app.topNav.alarm' },
  { path: '/data', labelId: 'app.topNav.data' },
  { path: '/log', labelId: 'app.topNav.log' },
];

const FEATURE_MENU_BY_PATH: Record<string, number> = {
  '/region': 1,
  '/account': 2,
  '/machine': 3,
  '/alarm': 4,
  '/data': 5,
  '/log': 6,
};

type CurrentUserResult = {
  data?: {
    userId?: number;
    username?: string;
    nickname?: string;
    avatar?: string;
    roleIds?: number[];
    menuIds?: number[];
  };
  userId?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  roleIds?: number[];
  menuIds?: number[];
};

const LANGUAGE_LABEL_IDS: Record<string, string> = {
  'zh-CN': 'app.language.zhCN',
  'en-US': 'app.language.enUS',
  'ar-SA': 'app.language.arSA',
};

const getActiveNavPath = (pathname: string) => {
  return (
    NAV_TABS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))?.path ??
    '/region'
  );
};

const getTokenUsername = (): string | undefined => {
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
        .join('')
    );
    const claims = JSON.parse(json) as { sub?: string; username?: string };
    return claims.username ?? claims.sub;
  } catch {
    return undefined;
  }
};

const getPathProvinceId = (pathname: string) => {
  const match = pathname.match(/^\/region\/province\/([^/?#]+)/);
  return match?.[1];
};

const CustomTopNav: React.FC = () => {
  const intl = useIntl();
  const [messageApi, contextHolder] = message.useMessage();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm] = Form.useForm();
  const activePath = getActiveNavPath(history.location.pathname);
  const currentLanguageLabelId = LANGUAGE_LABEL_IDS[getLocale()];
  const { data: currentUser, refresh: refreshCurrentUser } = useRequest(async () => {
    const result = await umiRequest<CurrentUserResult>('/api/v1/users/me');
    return (result?.data ?? result) as CurrentUserResult['data'];
  });
  const { data: brandingConfig, refresh: refreshBrandingConfig } = useRequest(queryBrandingConfig);
  const currentBrandingConfig = brandingConfig as
    | Awaited<ReturnType<typeof queryBrandingConfig>>
    | undefined;
  const [activeBrandingConfig, setActiveBrandingConfig] = useState(currentBrandingConfig);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    if (currentBrandingConfig) {
      setActiveBrandingConfig(currentBrandingConfig);
    }
  }, [currentBrandingConfig]);

  useEffect(() => {
    let cancelled = false;

    void queryBrandingConfig()
      .then((config) => {
        if (!cancelled) {
          setActiveBrandingConfig(config);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);
  const isBuiltinSuperAdmin = currentUser?.roleIds?.includes(1) && !currentUser?.menuIds?.length;
  const canEditBranding =
    currentUser?.userId === 1 ||
    currentUser?.username === 'admin' ||
    getTokenUsername() === 'admin';
  const visibleTabs =
    !currentUser || isBuiltinSuperAdmin
      ? NAV_TABS
      : NAV_TABS.filter((item) => currentUser.menuIds?.includes(FEATURE_MENU_BY_PATH[item.path]));
  const username =
    currentUser?.username ||
    currentUser?.nickname ||
    getTokenUsername() ||
    intl.formatMessage({ id: 'app.profile.notLoggedIn', defaultMessage: '未登录' });

  const brandName = pickBrandingText(activeBrandingConfig, 'brandName');
  const logoUrl = activeBrandingConfig?.logoUrl ?? '/logo.png';
  const logoSrc =
    logoUrl && logoUrl !== '/logo.png'
      ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(logoUrl)}`
      : logoUrl;

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    let lastSignature = '';
    let lastTime = 0;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const actionable = target?.closest<HTMLElement>('button, [role="button"], a');

      if (
        !actionable ||
        actionable.closest('.ant-modal-mask') ||
        actionable.closest('.custom-top-nav__tabs') ||
        actionable.closest('.ant-select-dropdown')
      ) {
        return;
      }

      const text = (actionable.innerText || actionable.getAttribute('aria-label') || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);

      if (!text) {
        return;
      }

      const actionCode = getActionCodeByText(text);
      const path = history.location.pathname;
      if (!shouldRecordClientAction(actionCode, path)) {
        return;
      }

      const now = Date.now();
      const signature = `${path}:${actionCode}:${text}`;
      if (signature === lastSignature && now - lastTime < 1200) {
        return;
      }

      lastSignature = signature;
      lastTime = now;

      void recordClientOperation({
        content: text,
        actionCode,
        moduleCode: getModuleCodeByPath(path),
        targetName: text,
        path,
        provinceId: getPathProvinceId(path),
      }).catch(() => undefined);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  const openProfileModal = () => {
    profileForm.setFieldsValue({
      username: currentUser?.username,
      nickname: currentUser?.nickname,
      oldPassword: undefined,
      newPassword: undefined,
      confirmPassword: undefined,
    });
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    profileForm.resetFields();
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setProfileSaving(true);
      const hasPasswordChange = Boolean(
        values.oldPassword || values.newPassword || values.confirmPassword
      );

      await umiRequest('/api/v1/users/profile', {
        method: 'PUT',
        data: {
          id: currentUser?.userId,
          username: currentUser?.username,
          nickname: values.nickname,
          avatar: currentUser?.avatar,
        },
      });

      if (hasPasswordChange) {
        await umiRequest('/api/v1/users/password', {
          method: 'PUT',
          data: {
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
          },
        });
        messageApi.success(
          intl.formatMessage({
            id: 'app.profile.passwordUpdated',
            defaultMessage: '密码已修改，请重新登录',
          })
        );
        setProfileModalOpen(false);
        localStorage.removeItem('accessToken');
        window.setTimeout(() => history.replace('/login'), 700);
        return;
      }

      messageApi.success(
        intl.formatMessage({
          id: 'app.profile.updateSuccess',
          defaultMessage: '个人信息已保存',
        })
      );
      setProfileModalOpen(false);
      refreshCurrentUser();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      messageApi.error(
        intl.formatMessage({
          id: 'app.profile.updateFailed',
          defaultMessage: '保存失败，请稍后重试',
        })
      );
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div className="custom-top-nav">
        <div className="custom-top-nav__header">
          <button
            className="custom-top-nav__brand"
            onClick={() => history.push('/region')}
            type="button"
          >
            <img
              key={logoSrc}
              alt="logo"
              src={logoLoadFailed ? '/logo.png' : logoSrc}
              onError={() => setLogoLoadFailed(true)}
              style={{ width: '40px', height: '40px' }}
            />
            <span>{brandName || intl.formatMessage({ id: 'app.brand' })}</span>
          </button>
          <div className="custom-top-nav__actions">
            {canEditBranding && (
              <Tooltip title="系统品牌配置">
                <Button
                  aria-label="系统品牌配置"
                  icon={<SettingOutlined />}
                  onClick={() => setBrandingModalOpen(true)}
                />
              </Tooltip>
            )}
            <Button className="custom-top-nav__user" icon={<UserOutlined />} onClick={openProfileModal}>
              {username}
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'zh-CN', label: intl.formatMessage({ id: 'app.language.zhCN' }) },
                  { key: 'en-US', label: intl.formatMessage({ id: 'app.language.enUS' }) },
                  { key: 'ar-SA', label: intl.formatMessage({ id: 'app.language.arSA' }) },
                ],
                onClick: ({ key }) => setLocale(key),
              }}
              trigger={['click']}
            >
              <Button icon={<GlobalOutlined />}>
                {currentLanguageLabelId
                  ? intl.formatMessage({ id: currentLanguageLabelId })
                  : intl.formatMessage({ id: 'app.language.default' })}
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={() => {
                localStorage.removeItem('accessToken');
                history.replace('/login');
              }}
            >
              {intl.formatMessage({ id: 'app.action.logout' })}
            </Button>
          </div>
        </div>
        <div className="custom-top-nav__tabs">
          {visibleTabs.map((item) => (
            <button
              key={item.path}
              className={item.path === activePath ? 'is-active' : undefined}
              onClick={() => history.push(item.path)}
              type="button"
            >
              {intl.formatMessage({ id: item.labelId })}
            </button>
          ))}
        </div>
      </div>
      <Modal
        title={intl.formatMessage({ id: 'app.profile.title', defaultMessage: '个人设置' })}
        open={profileModalOpen}
        onCancel={closeProfileModal}
        onOk={handleSaveProfile}
        confirmLoading={profileSaving}
        okText={intl.formatMessage({ id: 'app.profile.save', defaultMessage: '保存' })}
        cancelText={intl.formatMessage({ id: 'app.profile.cancel', defaultMessage: '取消' })}
        destroyOnHidden
      >
        <Form form={profileForm} layout="vertical">
          <Form.Item
            label={intl.formatMessage({ id: 'app.profile.username', defaultMessage: '账号名' })}
            name="username"
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: 'app.profile.nickname', defaultMessage: '昵称' })}
            name="nickname"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'app.profile.nicknameRequired',
                  defaultMessage: '请输入昵称',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'app.profile.nicknamePlaceholder',
                defaultMessage: '请输入昵称',
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: 'app.profile.oldPassword', defaultMessage: '原密码' })}
            name="oldPassword"
            dependencies={['newPassword', 'confirmPassword']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!getFieldValue('newPassword') && !getFieldValue('confirmPassword')) {
                    return Promise.resolve();
                  }
                  return value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          intl.formatMessage({
                            id: 'app.profile.oldPasswordRequired',
                            defaultMessage: '请输入原密码',
                          })
                        )
                      );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={intl.formatMessage({
                id: 'app.profile.oldPasswordPlaceholder',
                defaultMessage: '不修改密码可留空',
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: 'app.profile.newPassword', defaultMessage: '新密码' })}
            name="newPassword"
            dependencies={['oldPassword', 'confirmPassword']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!getFieldValue('oldPassword') && !getFieldValue('confirmPassword') && !value) {
                    return Promise.resolve();
                  }
                  if (!value) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'app.profile.newPasswordRequired',
                          defaultMessage: '请输入新密码',
                        })
                      )
                    );
                  }
                  if (value.length < 6) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'app.profile.passwordMinLength',
                          defaultMessage: '密码长度不能少于 6 位',
                        })
                      )
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={intl.formatMessage({
                id: 'app.profile.newPasswordPlaceholder',
                defaultMessage: '不修改密码可留空',
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'app.profile.confirmPassword',
              defaultMessage: '确认新密码',
            })}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!getFieldValue('newPassword') && !value) {
                    return Promise.resolve();
                  }
                  if (!value) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'app.profile.confirmPasswordRequired',
                          defaultMessage: '请确认新密码',
                        })
                      )
                    );
                  }
                  if (value !== getFieldValue('newPassword')) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'app.profile.passwordMismatch',
                          defaultMessage: '两次输入的密码不一致',
                        })
                      )
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={intl.formatMessage({
                id: 'app.profile.confirmPasswordPlaceholder',
                defaultMessage: '请再次输入新密码',
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
      {canEditBranding && (
        <BrandingSettingsModal
          open={brandingModalOpen}
          initialValues={activeBrandingConfig}
          onCancel={() => setBrandingModalOpen(false)}
          onSaved={(savedConfig) => {
            setActiveBrandingConfig(savedConfig as Awaited<ReturnType<typeof queryBrandingConfig>>);
            setBrandingModalOpen(false);
            refreshBrandingConfig();
          }}
        />
      )}
    </>
  );
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
}> {
  return {
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout APIs: https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    actionsRender: false,
    avatarProps: undefined,
    onPageChange: () => {
      const { location } = history;
      if (location.pathname === '/') {
        history.replace('/region');
      }
    },
    fixedHeader: false,
    contentWidth: 'Fluid',
    bgLayoutImgList: [],
    links: [],
    menuRender: false,
    menuHeaderRender: false,
    headerTitleRender: false,
    headerRender: () => <CustomTopNav />,
    // Custom 403 page
    // unAccessible: <div>unAccessible</div>,
    // Add a loading state
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request config, including error handling.
 * It provides unified network request and error handling based on axios and ahooks useRequest.
 * @doc https://umijs.org/docs/max/request#config
 */
export const request: RequestConfig = {
  ...errorConfig,
};
