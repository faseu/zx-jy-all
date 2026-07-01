import { PageContainer } from '@ant-design/pro-components';
import { history, request, useIntl, useRequest } from '@umijs/max';
import { Button, Col, Form, Input, Modal, Row, Select, Space, Table, Tooltip, message } from 'antd';
import React, { useEffect, useState } from 'react';
import gb from '@/assets/gb.png';
import { queryProvinceList } from '@/pages/region/service';
import type { ProvinceVO } from '@/pages/region/data.d';
import type { SuperAdminVO, UserFormVO } from './data.d';
import {
  createSuperAdmin,
  deleteSuperAdmin,
  queryAdminPage,
  queryUserForm,
  resetSuperAdminPassword,
  updateSuperAdminArea,
  updateSuperAdminPermission,
} from './service';
import styles from './index.less';
import NoPermission from '../NoPermission';
import { canAccessSuperAdminPage, getTokenCurrentUser } from '../permissions';

const featureOptionIds = [
  { labelId: 'pages.account.feature.province', defaultLabel: 'Province', value: '1' },
  { labelId: 'pages.account.feature.userManagement', defaultLabel: 'User Management', value: '2' },
  {
    labelId: 'pages.account.feature.deviceManagement',
    defaultLabel: 'Device Management',
    value: '3',
  },
  { labelId: 'pages.account.feature.alarm', defaultLabel: 'Alarm', value: '4' },
  { labelId: 'pages.account.feature.statistics', defaultLabel: 'Statistics', value: '5' },
  { labelId: 'pages.account.feature.log', defaultLabel: 'Log', value: '6' },
];

const ALL_AREA_VALUE = '__all_areas__';
const ALL_FEATURE_VALUE = '__all_features__';
const BUILTIN_SUPER_ADMIN_ID = 1;
const BUILTIN_SUPER_ADMIN_USERNAME = 'admin';
const BUILTIN_SUPER_ADMIN_NICKNAME = '超级管理员';

const getAreaText = (record: SuperAdminVO): string => {
  if (record.area && record.area.trim()) {
    return record.area;
  }
  if (record.manageArea && record.manageArea.trim()) {
    return record.manageArea;
  }
  if (Array.isArray(record.manageAreas) && record.manageAreas.length > 0) {
    return record.manageAreas.filter(Boolean).join(', ');
  }

  return '-';
};

const getErrorMessage = (error: unknown): string | undefined =>
  (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg ||
  (error as { info?: { errorMessage?: string } })?.info?.errorMessage;

type OperationMode = 'area' | 'feature' | 'password';

type CurrentUserResult = {
  data?: {
    userId?: number | string;
    roleIds?: Array<number | string>;
  };
  userId?: number | string;
  roleIds?: Array<number | string>;
};

const SuperAdminListPage: React.FC = () => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [editingRecord, setEditingRecord] = useState<SuperAdminVO>();
  const [editingFormData, setEditingFormData] = useState<UserFormVO>();
  const [operationLoading, setOperationLoading] = useState(false);
  const [menuMap, setMenuMap] = useState<Record<string, Array<number | string>>>({});
  const [form] = Form.useForm();
  const [areaForm] = Form.useForm();
  const [featureForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });
  const featureOptions = featureOptionIds.map((item) => ({
    label: t(item.labelId, item.defaultLabel),
    value: item.value,
  }));
  const featureValues = featureOptions.map((item) => item.value);
  const authOptions = [
    {
      label: t('pages.account.option.allFeatures', 'All features'),
      value: ALL_FEATURE_VALUE,
    },
    ...featureOptions,
  ];
  const { data, loading, refresh } = useRequest(
    () =>
      queryAdminPage({
        pageNum: 1,
        pageSize: 10,
      }),
    {
      onError: () => {
        message.error(
          t(
            'pages.account.message.superAdminLoadFailed',
            'Failed to load super admin list. Please try again later.'
          )
        );
      },
    }
  );
  const { data: currentUser, loading: currentUserLoading } = useRequest(async () => {
    const result = await request<CurrentUserResult>('/api/v1/users/me');
    return (result?.data ?? result) as CurrentUserResult['data'];
  });
  const { data: provinceData, loading: provinceLoading } = useRequest(queryProvinceList);
  const adminList = data?.list ?? [];
  const provinceOptions = ((provinceData ?? []) as ProvinceVO[])
    .filter((item) => item.provinceId !== undefined && item.provinceName)
    .map((item) => ({
      label: item.provinceName as string,
      value: String(item.provinceId),
    }));
  const provinceValues = provinceOptions.map((item) => item.value);
  const areaOptions = [
    {
      label: t('pages.account.option.allAreas', 'All areas'),
      value: ALL_AREA_VALUE,
    },
    ...provinceOptions,
  ];

  const normalizeIds = (values?: Array<number | string>) =>
    (values ?? [])
      .filter((value) => value !== ALL_AREA_VALUE && value !== ALL_FEATURE_VALUE)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

  const normalizeSelectValues = (values?: Array<number | string>) =>
    (values ?? [])
      .filter((value) => value !== ALL_AREA_VALUE && value !== ALL_FEATURE_VALUE)
      .map((value) => String(value));

  const getRecordId = (record?: SuperAdminVO) => record?.id ?? record?.userId;

  const isBuiltinSuperAdmin = (record?: SuperAdminVO) =>
    String(getRecordId(record)) === String(BUILTIN_SUPER_ADMIN_ID) ||
    record?.username === BUILTIN_SUPER_ADMIN_USERNAME;

  const adminTableData = [...adminList].sort((left, right) => {
    if (isBuiltinSuperAdmin(left)) {
      return -1;
    }
    if (isBuiltinSuperAdmin(right)) {
      return 1;
    }
    return 0;
  }).map((record) => ({
    ...record,
    menuIds: menuMap[String(getRecordId(record) ?? '')] ?? record.menuIds,
  }));

  const getNicknameDisplay = (record: SuperAdminVO) =>
    isBuiltinSuperAdmin(record) ? BUILTIN_SUPER_ADMIN_NICKNAME : record.nickname;

  const getAreaDisplay = (record: SuperAdminVO) => {
    if (isBuiltinSuperAdmin(record)) {
      const allAreasText = t('pages.account.option.allAreasShort', '全部');
      return {
        fullText: allAreasText,
        displayText: allAreasText,
      };
    }

    const fullText = getAreaText(record);
    const areaNames = fullText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const areaNameSet = new Set(areaNames);
    const isAllArea =
      provinceOptions.length > 0 &&
      areaNameSet.size >= provinceOptions.length &&
      provinceOptions.every((item) => areaNameSet.has(String(item.label)));

    return {
      fullText,
      displayText: isAllArea ? t('pages.account.option.allAreasShort', '全部') : fullText,
    };
  };

  const getFeatureDisplay = (record: SuperAdminVO) => {
    if (isBuiltinSuperAdmin(record)) {
      const allFeaturesText = t('pages.account.option.allAreasShort', '全部');
      return {
        fullText: allFeaturesText,
        displayText: allFeaturesText,
      };
    }

    const selectedMenuValues = normalizeSelectValues(record.menuIds).filter((value) =>
      featureValues.includes(value),
    );
    const matchedLabels = featureOptions
      .filter((item) => selectedMenuValues.includes(item.value))
      .map((item) => String(item.label));

    if (matchedLabels.length === 0) {
      return {
        fullText: '-',
        displayText: '-',
      };
    }

    const isAllFeatures = matchedLabels.length === featureOptions.length;
    const fullText = matchedLabels.join(', ');

    return {
      fullText,
      displayText: isAllFeatures
        ? t('pages.account.action.allPermissions', 'All Permissions')
        : fullText,
    };
  };

  const buildUpdatePayload = (
    formData: UserFormVO,
    overrides: Partial<Pick<UserFormVO, 'areaIds' | 'menuIds'>>,
  ) => ({
    username: formData.username ?? '',
    nickname: formData.nickname ?? '',
    password: '__unchanged__',
    roleId: 1 as const,
    deptId: formData.deptId,
    areaIds: normalizeIds(overrides.areaIds ?? formData.areaIds),
    menuIds: normalizeIds(overrides.menuIds ?? formData.menuIds),
  });

  const openOperationModal = async (mode: OperationMode, record: SuperAdminVO) => {
    const userId = getRecordId(record);
    if (!userId) {
      message.error(t('pages.account.message.userMissing', 'User data is incomplete.'));
      return;
    }

    try {
      setOperationLoading(true);
      const result = await queryUserForm(userId);
      const formData = result?.data ?? {};
      const selectedFeatureValues = normalizeSelectValues(formData.menuIds).filter((value) =>
        featureValues.includes(value),
      );
      const normalizedFormData: UserFormVO = {
        ...formData,
        areaIds: normalizeSelectValues(formData.areaIds),
        menuIds: selectedFeatureValues.length > 0 ? selectedFeatureValues : featureValues,
      };

      setEditingRecord(record);
      setEditingFormData(normalizedFormData);
      setEditingRecord({
        ...record,
        menuIds: normalizedFormData.menuIds,
      });
      setOperationMode(mode);
      if (mode === 'area') {
        areaForm.setFieldsValue({ areaIds: normalizedFormData.areaIds ?? [] });
      }
      if (mode === 'feature') {
        featureForm.setFieldsValue({ menuIds: normalizedFormData.menuIds ?? featureValues });
      }
      if (mode === 'password') {
        passwordForm.resetFields();
      }
    } catch (error) {
      message.error(
        getErrorMessage(error) ||
          t('pages.account.message.loadUserFailed', 'Failed to load user data.')
      );
    } finally {
      setOperationLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const allFeatureValues = featureOptionIds.map((item) => item.value);

    const loadMenuMap = async () => {
      const records = data?.list ?? [];
      if (records.length === 0) {
        if (!cancelled) {
          setMenuMap({});
        }
        return;
      }

      const entries = await Promise.all(
        records.map(async (record) => {
          const userId = getRecordId(record);
          if (!userId || isBuiltinSuperAdmin(record)) {
            return [String(userId ?? ''), allFeatureValues] as const;
          }

          try {
            const result = await queryUserForm(userId);
            const menuIds = normalizeSelectValues(result?.data?.menuIds).filter((value) =>
              allFeatureValues.includes(value),
            );
            return [String(userId), menuIds] as const;
          } catch {
            return [String(userId), []] as const;
          }
        }),
      );

      if (!cancelled) {
        setMenuMap(Object.fromEntries(entries));
      }
    };

    loadMenuMap();

    return () => {
      cancelled = true;
    };
  }, [data?.list]);

  const closeOperationModal = () => {
    setOperationMode(undefined);
    setEditingRecord(undefined);
    setEditingFormData(undefined);
    areaForm.resetFields();
    featureForm.resetFields();
    passwordForm.resetFields();
  };

  const handleAreaSave = async () => {
    if (!editingRecord || !editingFormData) {
      return;
    }
    const userId = getRecordId(editingRecord);
    if (!userId) {
      return;
    }

    try {
      const values = await areaForm.validateFields();
      setOperationLoading(true);
      await updateSuperAdminArea(
        userId,
        buildUpdatePayload(editingFormData, { areaIds: values.areaIds }),
      );
      message.success(t('pages.account.message.updateSuccess', 'Updated successfully.'));
      closeOperationModal();
      refresh();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      message.error(
        getErrorMessage(error) ||
          t('pages.account.message.updateFailed', 'Update failed. Please try again later.')
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleFeatureSave = async () => {
    if (!editingRecord || !editingFormData) {
      return;
    }
    const userId = getRecordId(editingRecord);
    if (!userId) {
      return;
    }

    try {
      const values = await featureForm.validateFields();
      setOperationLoading(true);
      await updateSuperAdminPermission(
        userId,
        buildUpdatePayload(editingFormData, { menuIds: values.menuIds }),
      );
      message.success(t('pages.account.message.updateSuccess', 'Updated successfully.'));
      closeOperationModal();
      refresh();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      message.error(
        getErrorMessage(error) ||
          t('pages.account.message.updateFailed', 'Update failed. Please try again later.')
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!editingRecord) {
      return;
    }
    const userId = getRecordId(editingRecord);
    if (!userId) {
      return;
    }

    try {
      const values = await passwordForm.validateFields();
      setOperationLoading(true);
      await resetSuperAdminPassword(userId, values.password);
      message.success(t('pages.account.message.passwordResetSuccess', 'Password updated.'));
      closeOperationModal();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      message.error(
        getErrorMessage(error) ||
          t('pages.account.message.passwordResetFailed', 'Password update failed.')
      );
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDelete = (record: SuperAdminVO) => {
    const userId = getRecordId(record);
    if (!userId) {
      message.error(t('pages.account.message.userMissing', 'User data is incomplete.'));
      return;
    }
    if (String(userId) === String(currentUser?.userId)) {
      message.warning(t('pages.account.message.cannotDeleteSelf', 'You cannot delete yourself.'));
      return;
    }

    Modal.confirm({
      title: t('pages.account.confirm.deleteTitle', 'Delete account?'),
      content: t(
        'pages.account.confirm.deleteContent',
        'This account will be removed and its permissions will no longer apply.'
      ),
      okText: t('pages.account.action.delete', 'Delete'),
      okButtonProps: { danger: true },
      cancelText: t('pages.account.action.cancel', 'Cancel'),
      onOk: async () => {
        try {
          await deleteSuperAdmin(userId);
          message.success(t('pages.account.message.deleteSuccess', 'Deleted successfully.'));
          refresh();
        } catch (error) {
          message.error(
            getErrorMessage(error) ||
              t('pages.account.message.deleteFailed', 'Delete failed. Please try again later.')
          );
        }
      },
    });
  };

  const handleAreaChange = (values: Array<number | string>) => {
    if (values.includes(ALL_AREA_VALUE)) {
      form.setFieldsValue({ areaIds: provinceValues });
    }
  };

  const handleFeatureChange = (values: Array<number | string>) => {
    if (values.includes(ALL_FEATURE_VALUE)) {
      form.setFieldsValue({ features: featureValues });
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await createSuperAdmin({
        username: values.username,
        nickname: values.nickname,
        password: values.password,
        roleId: 1,
        areaIds: normalizeIds(values.areaIds),
        menuIds: normalizeIds(values.features),
      });
      message.success(t('pages.account.message.createSuccess', 'Created successfully.'));
      setIsModalOpen(false);
      form.resetFields();
      refresh();
    } catch (error) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        return;
      }
      message.error(
        getErrorMessage(error) ||
          t('pages.account.message.createFailed', 'Create failed. Please try again later.')
      );
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const openCreateModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const tokenUser = getTokenCurrentUser();
  const effectiveUser = {
    ...tokenUser,
    ...currentUser,
    roles: currentUser?.roles ?? tokenUser?.roles,
  };

  if (currentUserLoading) {
    return <PageContainer title={false} />;
  }

  if (!canAccessSuperAdminPage(effectiveUser)) {
    return (
      <PageContainer title={false}>
        <NoPermission />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={false}>
      <div className={styles.pageShell}>
        <Row gutter={0} className={styles.contentRow}>
          <Col xs={24} xl={6} style={{ overflow: 'hidden' }}>
            <div
              style={{
                position: 'relative',
                height: 'calc(100vh - 128px)',
                backgroundImage: `url(${gb})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            ></div>
          </Col>
          <Col xs={24} xl={18} className={styles.rightPane}>
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>
                {t('pages.account.role.superAdmin', 'Super Admin')}
              </h2>
              <Space size="small">
                <Button type="primary" onClick={openCreateModal}>
                  {t('pages.account.action.create', 'Create')}
                </Button>
                <Button
                  className={`${styles.backButton} soft-green-action`}
                  onClick={() => history.push('/account')}
                >
                  {t('pages.account.action.back', 'Back')}
                </Button>
              </Space>
            </div>
            <div className={styles.tableWrap}>
              <Table<SuperAdminVO>
                className={styles.adminTable}
                loading={loading}
                rowKey={(record) => String(record.id ?? record.username ?? '')}
                dataSource={adminTableData}
                pagination={false}
                columns={[
                  {
                    title: t('pages.account.field.username', 'Username'),
                    dataIndex: 'username',
                  },
                  {
                    title: t('pages.account.field.nickname', 'Nickname'),
                    dataIndex: 'nickname',
                    render: (_, record) => getNicknameDisplay(record),
                  },
                  {
                    title: t('pages.account.field.manageArea', 'Managed Area'),
                    dataIndex: 'area',
                    render: (_, record) => {
                      const areaDisplay = getAreaDisplay(record);
                      if (isBuiltinSuperAdmin(record)) {
                        return (
                          <Tooltip title={areaDisplay.fullText}>
                            <span className={styles.readonlyText}>{areaDisplay.displayText}</span>
                          </Tooltip>
                        );
                      }

                      return (
                        <Tooltip title={areaDisplay.fullText}>
                          <Button
                            type="link"
                            className={styles.areaButton}
                            onClick={() => openOperationModal('area', record)}
                          >
                            {areaDisplay.displayText}
                          </Button>
                        </Tooltip>
                      );
                    },
                  },
                  {
                    title: t('pages.account.field.featureAuth', 'Feature Authorization'),
                    key: 'feature-auth',
                    render: (_, record) => {
                      const featureDisplay = getFeatureDisplay(record);
                      return (
                      <Space size="small">
                        {isBuiltinSuperAdmin(record) ? (
                          <span>{featureDisplay.displayText}</span>
                        ) : (
                          <Tooltip title={featureDisplay.fullText}>
                            <Button
                              type="link"
                              className={styles.areaButton}
                              onClick={() => openOperationModal('feature', record)}
                            >
                              {featureDisplay.displayText}
                            </Button>
                          </Tooltip>
                        )}
                      </Space>
                    );
                    },
                  },
                  {
                    title: t('pages.account.field.passwordChange', 'Password Change'),
                    key: 'password-reset',
                    render: (_, record) => (
                      <Space size="small">
                        <Button
                          type="link"
                          disabled={isBuiltinSuperAdmin(record)}
                          onClick={() => openOperationModal('password', record)}
                        >
                          {t('pages.account.action.passwordChange', 'Password Change')}
                        </Button>
                      </Space>
                    ),
                  },
                  {
                    title: t('pages.account.field.accountDelete', 'Account Delete'),
                    key: 'account-remove',
                    render: (_, record) => (
                      <Space size="small">
                        <Button
                          type="link"
                          danger
                          disabled={isBuiltinSuperAdmin(record)}
                          onClick={() => handleDelete(record)}
                        >
                          {t('pages.account.action.delete', 'Delete')}
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </div>
          </Col>
        </Row>
      </div>
      <Modal
        title={t('pages.account.modal.createUser', 'Create User')}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={t('pages.account.action.save', 'Save')}
        cancelText={t('pages.account.action.cancel', 'Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('pages.account.field.username', 'Username')}
            name="username"
            rules={[
              {
                required: true,
                message: t('pages.account.validation.usernameRequired', 'Please enter username.'),
              },
            ]}
          >
            <Input
              placeholder={t('pages.account.validation.usernameRequired', 'Please enter username.')}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.nickname', 'Nickname')}
            name="nickname"
            rules={[
              {
                required: true,
                message: t('pages.account.validation.nicknameRequired', 'Please enter nickname.'),
              },
            ]}
          >
            <Input
              placeholder={t('pages.account.validation.nicknameRequired', 'Please enter nickname.')}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.password', 'Password')}
            name="password"
            rules={[
              {
                required: true,
                message: t('pages.account.validation.passwordRequired', 'Please enter password.'),
              },
            ]}
          >
            <Input.Password
              placeholder={t('pages.account.validation.passwordRequired', 'Please enter password.')}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.manageArea', 'Managed Area')}
            name="areaIds"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.manageAreaRequired',
                  'Please select managed area.'
                ),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t(
                'pages.account.validation.manageAreaRequired',
                'Please select managed area.'
              )}
              loading={provinceLoading}
              options={areaOptions}
              maxTagCount="responsive"
              allowClear
              onChange={handleAreaChange}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.featureAuth', 'Feature Authorization')}
            name="features"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.featureAuthRequired',
                  'Please select feature authorization.'
                ),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t(
                'pages.account.validation.featureAuthRequired',
                'Please select feature authorization.'
              )}
              options={authOptions}
              allowClear
              onChange={handleFeatureChange}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={t('pages.account.field.manageArea', 'Managed Area')}
        open={operationMode === 'area'}
        onOk={handleAreaSave}
        onCancel={closeOperationModal}
        confirmLoading={operationLoading}
        okText={t('pages.account.action.save', 'Save')}
        cancelText={t('pages.account.action.cancel', 'Cancel')}
      >
        <Form form={areaForm} layout="vertical">
          <Form.Item
            label={t('pages.account.field.manageArea', 'Managed Area')}
            name="areaIds"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.manageAreaRequired',
                  'Please select managed area.'
                ),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t(
                'pages.account.validation.manageAreaRequired',
                'Please select managed area.'
              )}
              loading={provinceLoading || operationLoading}
              options={areaOptions}
              maxTagCount="responsive"
              allowClear
              onChange={(values) => {
                if (values.includes(ALL_AREA_VALUE)) {
                  areaForm.setFieldsValue({ areaIds: provinceValues });
                }
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={t('pages.account.field.featureAuth', 'Feature Authorization')}
        open={operationMode === 'feature'}
        onOk={handleFeatureSave}
        onCancel={closeOperationModal}
        confirmLoading={operationLoading}
        okText={t('pages.account.action.save', 'Save')}
        cancelText={t('pages.account.action.cancel', 'Cancel')}
      >
        <Form form={featureForm} layout="vertical">
          <Form.Item
            label={t('pages.account.field.featureAuth', 'Feature Authorization')}
            name="menuIds"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.featureAuthRequired',
                  'Please select feature authorization.'
                ),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t(
                'pages.account.validation.featureAuthRequired',
                'Please select feature authorization.'
              )}
              options={authOptions}
              allowClear
              onChange={(values) => {
                if (values.includes(ALL_FEATURE_VALUE)) {
                  featureForm.setFieldsValue({ menuIds: featureValues });
                }
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={t('pages.account.field.passwordChange', 'Password Change')}
        open={operationMode === 'password'}
        onOk={handlePasswordSave}
        onCancel={closeOperationModal}
        confirmLoading={operationLoading}
        okText={t('pages.account.action.save', 'Save')}
        cancelText={t('pages.account.action.cancel', 'Cancel')}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label={t('pages.account.field.password', 'Password')}
            name="password"
            rules={[
              {
                required: true,
                message: t('pages.account.validation.passwordRequired', 'Please enter password.'),
              },
              {
                min: 6,
                message: t(
                  'pages.account.validation.passwordMinLength',
                  'Password must be at least 6 characters.'
                ),
              },
            ]}
          >
            <Input.Password
              placeholder={t('pages.account.validation.passwordRequired', 'Please enter password.')}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.confirmPassword', 'Confirm Password')}
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.confirmPasswordRequired',
                  'Please confirm password.'
                ),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(
                      t(
                        'pages.account.validation.passwordMismatch',
                        'The two passwords do not match.'
                      )
                    )
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder={t(
                'pages.account.validation.confirmPasswordRequired',
                'Please confirm password.'
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SuperAdminListPage;
