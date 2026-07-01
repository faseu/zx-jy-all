import { PageContainer } from '@ant-design/pro-components';
import { MenuFoldOutlined, MenuUnfoldOutlined, RightOutlined } from '@ant-design/icons';
import { history, request, useIntl, useRequest } from '@umijs/max';
import { Button, Col, Form, Input, Modal, Row, Select, Space, Table, Tooltip, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import OrgTree from '@/components/OrgTree';
import type { BuildingDetailVO, PrisonVO, ProvinceVO } from '@/pages/region/data.d';
import type { OrgTreeSelectionParams } from '@/components/OrgTree';
import {
  queryPrisonBuildings,
  queryProvinceList,
  queryProvincePrisons,
} from '@/pages/region/service';
import type {
  PrisonAdminPageParams,
  PrisonAdminVO,
  UpdatePrisonAdminParams,
  UserFormVO,
} from './data.d';
import {
  createPrisonAdmin,
  deletePrisonAdmin,
  queryPrisonAdminPage,
  queryUserForm,
  resetPrisonAdminPassword,
  updatePrisonAdminArea,
  updatePrisonAdminPermission,
} from './service';
import styles from './index.less';
import NoPermission from '../NoPermission';
import { canAccessPrisonAdminPage, getTokenCurrentUser } from '../permissions';

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

const ALL_FEATURE_VALUE = '__all_features__';
const ALL_BUILDING_VALUE = '__all_buildings__';

type CurrentUserResult = {
  data?: {
    userId?: number | string;
    roleIds?: number[];
  };
  userId?: number | string;
  roleIds?: number[];
};

type OperationMode = 'area' | 'feature' | 'password';

const getAreaText = (record: PrisonAdminVO): string => {
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

const PrisonAdminListPage: React.FC = () => {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | string>();
  const [selectedPrisonId, setSelectedPrisonId] = useState<number | string>();
  const [selectedFormProvinceId, setSelectedFormProvinceId] = useState<number | string>();
  const [operationMode, setOperationMode] = useState<OperationMode>();
  const [editingRecord, setEditingRecord] = useState<PrisonAdminVO>();
  const [editingFormData, setEditingFormData] = useState<UserFormVO>();
  const [operationLoading, setOperationLoading] = useState(false);
  const [treePanelCollapsed, setTreePanelCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [areaForm] = Form.useForm();
  const [featureForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const selectedModalProvinceId = Form.useWatch('provinceId', form);
  const selectedDeptId = Form.useWatch('deptId', form);
  const operationProvinceId = Form.useWatch('provinceId', areaForm);
  const operationDeptId = Form.useWatch('deptId', areaForm);
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
  const { data: currentUser, loading: currentUserLoading } = useRequest(async () => {
    const result = await request<CurrentUserResult>('/api/v1/users/me');
    return (result?.data ?? result) as CurrentUserResult['data'];
  });
  const { data: provinceData, loading: provinceLoading } = useRequest(queryProvinceList);
  const {
    data: prisonAdminPageData,
    loading: prisonAdminLoading,
    run: runQueryPrisonAdminPage,
  } = useRequest(queryPrisonAdminPage, {
    manual: true,
    onError: () => {
      message.error(
        t(
          'pages.account.message.prisonAdminLoadFailed',
          'Failed to load prison admin list. Please try again later.'
        )
      );
    },
  });
  const {
    data: prisonData,
    loading: prisonLoading,
    run: runQueryProvincePrisons,
  } = useRequest(queryProvincePrisons, {
    manual: true,
    onError: () => {
      message.error(
        t(
          'pages.account.message.prisonListLoadFailed',
          'Failed to load prison list. Please try again later.'
        )
      );
    },
  });
  const {
    data: buildingData,
    loading: buildingLoading,
    run: runQueryPrisonBuildings,
  } = useRequest(queryPrisonBuildings, {
    manual: true,
    onError: () => {
      message.error(
        t(
          'pages.account.message.buildingListLoadFailed',
          'Failed to load building list. Please try again later.'
        )
      );
    },
  });

  const provinceList = (provinceData ?? []) as ProvinceVO[];
  const prisonAdminList = prisonAdminPageData?.list ?? [];
  const prisonList = (prisonData ?? []) as PrisonVO[];
  const buildingList = (buildingData ?? []) as BuildingDetailVO[];
  const provinceOptions = provinceList
    .filter((item) => item.provinceId !== undefined && item.provinceName)
    .map((item) => ({
      label: item.provinceName as string,
      value: String(item.provinceId),
    }));
  const prisonOptions = prisonList
    .filter((item) => item.id !== undefined && item.name)
    .map((item) => ({
      label: item.name as string,
      value: String(item.id),
    }));
  const buildingOptions = buildingList
    .filter((item) => item.id !== undefined && item.name)
    .map((item) => ({
      label: item.name as string,
      value: String(item.id),
    }));
  const buildingOptionValues = buildingOptions.map((item) => item.value);
  const managedBuildingOptions = [
    {
      label: t('pages.account.option.allBuildings', 'All buildings'),
      value: ALL_BUILDING_VALUE,
    },
    ...buildingOptions,
  ];

  const normalizeIds = (values?: Array<number | string>) =>
    (values ?? [])
      .filter((value) => value !== ALL_FEATURE_VALUE && value !== ALL_BUILDING_VALUE)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

  const normalizeSelectValues = (values?: Array<number | string>) =>
    (values ?? [])
      .filter((value) => value !== ALL_FEATURE_VALUE && value !== ALL_BUILDING_VALUE)
      .map((value) => String(value));

  const getRecordId = (record?: PrisonAdminVO) => record?.id ?? record?.userId;

  const buildUpdatePayload = (
    formData: UserFormVO,
    overrides: Partial<Pick<UpdatePrisonAdminParams, 'deptId' | 'areaIds' | 'menuIds'>>,
  ): UpdatePrisonAdminParams => ({
    username: formData.username ?? '',
    nickname: formData.nickname ?? '',
    password: '__unchanged__',
    roleId: 3,
    deptId: overrides.deptId ?? formData.deptId,
    areaIds: normalizeIds(overrides.areaIds ?? formData.areaIds),
    menuIds: normalizeIds(overrides.menuIds ?? formData.menuIds),
  });

  const runSearch = useCallback(
    (provinceId?: number | string, prisonId?: number | string) => {
      const params: PrisonAdminPageParams = {
        pageNum: 1,
        pageSize: 10,
      };

      if (provinceId !== undefined && provinceId !== null) {
        params.provinceId = provinceId;
      }
      if (prisonId !== undefined && prisonId !== null) {
        params.prisonId = prisonId;
      }

      runQueryPrisonAdminPage(params);
    },
    [runQueryPrisonAdminPage]
  );

  useEffect(() => {
    runSearch(selectedProvinceId, selectedPrisonId);
  }, [runSearch, selectedProvinceId, selectedPrisonId]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    form.setFieldsValue({
      provinceId: selectedFormProvinceId ?? undefined,
      deptId: selectedPrisonId ?? undefined,
      areaIds: undefined,
    });
  }, [form, isModalOpen, selectedFormProvinceId, selectedPrisonId]);

  useEffect(() => {
    if (!isModalOpen || selectedModalProvinceId === undefined || selectedModalProvinceId === null) {
      return;
    }

    runQueryProvincePrisons(selectedModalProvinceId);
  }, [isModalOpen, runQueryProvincePrisons, selectedModalProvinceId]);

  useEffect(() => {
    if (!isModalOpen || selectedDeptId === undefined || selectedDeptId === null) {
      return;
    }

    runQueryPrisonBuildings(selectedDeptId);
  }, [isModalOpen, runQueryPrisonBuildings, selectedDeptId]);

  useEffect(() => {
    if (operationMode !== 'area' || operationProvinceId === undefined || operationProvinceId === null) {
      return;
    }

    runQueryProvincePrisons(operationProvinceId);
  }, [operationMode, operationProvinceId, runQueryProvincePrisons]);

  useEffect(() => {
    if (operationMode !== 'area' || operationDeptId === undefined || operationDeptId === null) {
      return;
    }

    runQueryPrisonBuildings(operationDeptId);
  }, [operationMode, operationDeptId, runQueryPrisonBuildings]);

  const openOperationModal = async (mode: OperationMode, record: PrisonAdminVO) => {
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
      const provinceId =
        (formData as UserFormVO & { provinceId?: number | string }).provinceId ??
        selectedFormProvinceId ??
        selectedProvinceId;
      const normalizedFormData: UserFormVO = {
        ...formData,
        deptId: formData.deptId ? String(formData.deptId) : formData.deptId,
        areaIds: normalizeSelectValues(formData.areaIds),
        menuIds: selectedFeatureValues.length > 0 ? selectedFeatureValues : featureValues,
      };

      if (provinceId !== undefined && provinceId !== null) {
        await runQueryProvincePrisons(provinceId);
      }
      if (normalizedFormData.deptId !== undefined && normalizedFormData.deptId !== null) {
        await runQueryPrisonBuildings(normalizedFormData.deptId);
      }

      setEditingRecord(record);
      setEditingFormData(normalizedFormData);
      setOperationMode(mode);
      if (mode === 'area') {
        areaForm.setFieldsValue({
          provinceId: provinceId ? String(provinceId) : undefined,
          deptId: normalizedFormData.deptId,
          areaIds: normalizedFormData.areaIds ?? [],
        });
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
      await updatePrisonAdminArea(
        userId,
        buildUpdatePayload(editingFormData, {
          deptId: values.deptId,
          areaIds: values.areaIds,
        }),
      );
      message.success(t('pages.account.message.updateSuccess', 'Updated successfully.'));
      closeOperationModal();
      runSearch(selectedProvinceId, selectedPrisonId);
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
      await updatePrisonAdminPermission(
        userId,
        buildUpdatePayload(editingFormData, { menuIds: values.menuIds }),
      );
      message.success(t('pages.account.message.updateSuccess', 'Updated successfully.'));
      closeOperationModal();
      runSearch(selectedProvinceId, selectedPrisonId);
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
      await resetPrisonAdminPassword(userId, values.password);
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

  const handleDelete = (record: PrisonAdminVO) => {
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
          await deletePrisonAdmin(userId);
          message.success(t('pages.account.message.deleteSuccess', 'Deleted successfully.'));
          runSearch(selectedProvinceId, selectedPrisonId);
        } catch (error) {
          message.error(
            getErrorMessage(error) ||
              t('pages.account.message.deleteFailed', 'Delete failed. Please try again later.')
          );
        }
      },
    });
  };

  const handleFeatureChange = (values: Array<number | string>) => {
    if (values.includes(ALL_FEATURE_VALUE)) {
      form.setFieldsValue({ features: featureValues });
    }
  };

  const handleBuildingChange = (values: Array<number | string>, targetForm: typeof form) => {
    if (values.includes(ALL_BUILDING_VALUE)) {
      targetForm.setFieldsValue({ areaIds: buildingOptionValues });
    }
  };

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      provinceId: selectedFormProvinceId ?? undefined,
      deptId: selectedPrisonId ?? undefined,
      areaIds: undefined,
    });
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await createPrisonAdmin({
        username: values.username,
        nickname: values.nickname,
        password: values.password,
        roleId: 3,
        deptId: values.deptId,
        areaIds: normalizeIds(values.areaIds),
        menuIds: normalizeIds(values.features),
      });
      message.success(t('pages.account.message.createSuccess', 'Created successfully.'));
      setIsModalOpen(false);
      form.resetFields();
      runSearch(selectedProvinceId, selectedPrisonId);
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

  const tokenUser = getTokenCurrentUser();
  const effectiveUser = {
    ...tokenUser,
    ...currentUser,
    roles: currentUser?.roles ?? tokenUser?.roles,
  };

  if (currentUserLoading) {
    return <PageContainer title={false} />;
  }

  if (!canAccessPrisonAdminPage(effectiveUser)) {
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
          <Col
            xs={24}
            xl={treePanelCollapsed ? 1 : 6}
            className={`${styles.leftPane} ${treePanelCollapsed ? styles.leftPaneCollapsed : ''}`}
          >
            <div className={styles.treePanelToggleWrap}>
              <Button
                type="text"
                className={styles.treePanelToggle}
                icon={treePanelCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setTreePanelCollapsed((prev) => !prev)}
              />
            </div>
            {!treePanelCollapsed ? (
              <OrgTree
                provinceList={provinceList}
                loading={provinceLoading}
                maxLevel={2}
                className={styles.orgTree}
                onSelectionChange={(params: OrgTreeSelectionParams) => {
                  if (params.nodeType === 'prison') {
                    setSelectedProvinceId(undefined);
                    setSelectedPrisonId(params.prisonId);
                    setSelectedFormProvinceId(params.provinceId);
                    return;
                  }
                  if (params.nodeType === 'province') {
                    setSelectedProvinceId(params.provinceId);
                    setSelectedPrisonId(undefined);
                    setSelectedFormProvinceId(params.provinceId);
                    return;
                  }
                  if (params.nodeType === 'country') {
                    setSelectedProvinceId(undefined);
                    setSelectedPrisonId(undefined);
                    setSelectedFormProvinceId(undefined);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className={styles.treePanelExpandRail}
                onClick={() => setTreePanelCollapsed(false)}
              >
                <RightOutlined />
              </button>
            )}
          </Col>
          <Col xs={24} xl={treePanelCollapsed ? 23 : 18} className={styles.rightPane}>
            <div className={styles.headerRow}>
              <h2 className={styles.pageTitle}>
                {t('pages.account.role.prisonAdmin', 'Prison Admin')}
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
              <Table<PrisonAdminVO>
                className={styles.adminTable}
                loading={prisonAdminLoading}
                rowKey={(record) => String(record.id ?? record.username ?? '')}
                dataSource={prisonAdminList}
                pagination={false}
                scroll={{ x: 1060 }}
                columns={[
                  {
                    title: t('pages.account.field.username', 'Username'),
                    dataIndex: 'username',
                    width: 160,
                  },
                  {
                    title: t('pages.account.field.nickname', 'Nickname'),
                    dataIndex: 'nickname',
                    width: 180,
                  },
                  {
                    title: t('pages.account.field.manageArea', 'Managed Area'),
                    dataIndex: 'area',
                    width: 320,
                    render: (_, record) => {
                      const areaText = getAreaText(record);
                      return (
                        <Tooltip title={areaText}>
                          <Button
                            type="link"
                            className={styles.areaButton}
                            onClick={() => openOperationModal('area', record)}
                          >
                            {areaText}
                          </Button>
                        </Tooltip>
                      );
                    },
                  },
                  {
                    title: t('pages.account.field.featureAuth', 'Feature Authorization'),
                    key: 'feature-auth',
                    width: 190,
                    render: (_: unknown, record: PrisonAdminVO) => (
                      <Space size="small">
                        <Button type="link" onClick={() => openOperationModal('feature', record)}>
                          {t('pages.account.action.allPermissions', 'All Permissions')}
                        </Button>
                      </Space>
                    ),
                  },
                  {
                    title: t('pages.account.field.passwordChange', 'Password Change'),
                    key: 'password-reset',
                    width: 170,
                    render: (_: unknown, record: PrisonAdminVO) => (
                      <Space size="small">
                        <Button type="link" onClick={() => openOperationModal('password', record)}>
                          {t('pages.account.action.passwordChange', 'Password Change')}
                        </Button>
                      </Space>
                    ),
                  },
                  {
                    title: t('pages.account.field.accountDelete', 'Account Delete'),
                    key: 'account-remove',
                    width: 140,
                    render: (_: unknown, record: PrisonAdminVO) => (
                      <Space size="small">
                        <Button type="link" danger onClick={() => handleDelete(record)}>
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
            label={t('pages.account.field.belongProvince', 'Province')}
            name="provinceId"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.belongProvinceRequired',
                  'Please select province.'
                ),
              },
            ]}
          >
            <Select
              placeholder={t(
                'pages.account.validation.belongProvinceRequired',
                'Please select province.'
              )}
              loading={provinceLoading}
              options={provinceOptions}
              onChange={() => {
                form.setFieldsValue({ deptId: undefined, areaIds: undefined });
              }}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.belongPrison', 'Prison')}
            name="deptId"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.belongPrisonRequired',
                  'Please select prison.'
                ),
              },
            ]}
          >
            <Select
              placeholder={t(
                'pages.account.validation.belongPrisonRequired',
                'Please select prison.'
              )}
              loading={prisonLoading}
              disabled={!selectedModalProvinceId}
              options={prisonOptions}
              onChange={() => {
                form.setFieldsValue({ areaIds: undefined });
              }}
            />
          </Form.Item>
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
            label={t('pages.account.field.manageBuilding', 'Managed Building')}
            name="areaIds"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.manageBuildingRequired',
                  'Please select managed building.'
                ),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t(
                'pages.account.validation.manageBuildingRequired',
                'Please select managed building.'
              )}
              loading={buildingLoading}
              disabled={!selectedDeptId}
              options={managedBuildingOptions}
              maxTagCount="responsive"
              allowClear
              onChange={(values) => handleBuildingChange(values, form)}
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
            label={t('pages.account.field.belongProvince', 'Province')}
            name="provinceId"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.belongProvinceRequired',
                  'Please select province.'
                ),
              },
            ]}
          >
            <Select
              placeholder={t(
                'pages.account.validation.belongProvinceRequired',
                'Please select province.'
              )}
              loading={provinceLoading}
              options={provinceOptions}
              onChange={() => {
                areaForm.setFieldsValue({ deptId: undefined, areaIds: undefined });
              }}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.belongPrison', 'Prison')}
            name="deptId"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.belongPrisonRequired',
                  'Please select prison.'
                ),
              },
            ]}
          >
            <Select
              placeholder={t(
                'pages.account.validation.belongPrisonRequired',
                'Please select prison.'
              )}
              loading={prisonLoading || operationLoading}
              disabled={!operationProvinceId}
              options={prisonOptions}
              onChange={() => {
                areaForm.setFieldsValue({ areaIds: undefined });
              }}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.account.field.manageBuilding', 'Managed Building')}
            name="areaIds"
            rules={[
              {
                required: true,
                message: t(
                  'pages.account.validation.manageBuildingRequired',
                  'Please select managed building.'
                ),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder={t(
                'pages.account.validation.manageBuildingRequired',
                'Please select managed building.'
              )}
              loading={buildingLoading || operationLoading}
              disabled={!operationDeptId}
              options={managedBuildingOptions}
              maxTagCount="responsive"
              allowClear
              onChange={(values) => handleBuildingChange(values, areaForm)}
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

export default PrisonAdminListPage;
