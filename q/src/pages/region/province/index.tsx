import { CloseOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useParams, useRequest } from '@umijs/max';
import { Button, Col, Divider, Form, List, Modal, Row, Spin, message } from 'antd';
import React, { useMemo, useState } from 'react';
import gb from '@/assets/gb.png';
import PrisonFormModal from '../components/PrisonFormModal';
import type { PrisonFormVO, PrisonVO, ProvinceDetailVO } from '../data.d';
import {
  createPrison,
  deletePrison,
  queryPrisonForm,
  queryProvinceDetail,
  queryProvincePrisons,
  updatePrison,
} from '../service';

type PrisonListItem = Omit<PrisonVO, 'id'> & { __isNew?: boolean; id?: number | string };

const cardColors = ['#cae9f8', '#f0dd93', '#e8c0c9'];

const ProvinceDetailPage: React.FC = () => {
  const intl = useIntl();
  const params = useParams<{ id: string }>();
  const provinceId = params.id ?? '';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPrisonId, setEditingPrisonId] = useState<number | undefined>(undefined);
  const [editingPrisonForm, setEditingPrisonForm] = useState<PrisonFormVO | undefined>(undefined);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [form] = Form.useForm();

  const {
    data: detailData,
    loading: detailLoading,
    refresh: refreshProvinceDetail,
  } = useRequest(() => queryProvinceDetail(provinceId), {
    ready: Boolean(provinceId),
    refreshDeps: [provinceId],
  });

  const {
    data: prisonsData,
    loading: prisonsLoading,
    refresh: refreshPrisons,
  } = useRequest(() => queryProvincePrisons(provinceId), {
    ready: Boolean(provinceId),
    refreshDeps: [provinceId],
  });

  const detail: ProvinceDetailVO | undefined = detailData;
  const prisons: PrisonVO[] = prisonsData ?? [];

  const listData = useMemo<PrisonListItem[]>(
    () => [
      ...[...prisons].sort((a, b) => (b.level ?? 0) - (a.level ?? 0)),
      { id: 'new', __isNew: true },
    ],
    [prisons]
  );

  const handleOpenModal = () => {
    setModalMode('create');
    setEditingPrisonId(undefined);
    setEditingPrisonForm(undefined);
    form.resetFields();
    form.setFieldsValue({ deptId: provinceId ? Number(provinceId) : undefined });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (prisonId?: number) => {
    if (!prisonId) {
      return;
    }
    try {
      const { data: prisonForm } = await queryPrisonForm(prisonId);
      if (!prisonForm) {
        message.error(intl.formatMessage({ id: 'pages.region.message.prisonFormLoadFailed' }));
        return;
      }
      setModalMode('edit');
      setEditingPrisonId(prisonId);
      setEditingPrisonForm(prisonForm);
      form.setFieldsValue(prisonForm);
      setIsModalOpen(true);
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.region.message.prisonFormLoadFailed' }));
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      setSubmitLoading(true);
      if (modalMode === 'edit' && editingPrisonId) {
        const payload: PrisonFormVO = {
          ...(editingPrisonForm || {}),
          ...values,
          id: editingPrisonForm?.id ?? editingPrisonId,
        };
        await updatePrison(editingPrisonId, payload);
        message.success(intl.formatMessage({ id: 'pages.region.message.prisonUpdated' }));
      } else {
        await createPrison(values);
        message.success(intl.formatMessage({ id: 'pages.region.message.prisonCreated' }));
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingPrisonId(undefined);
      setEditingPrisonForm(undefined);
      refreshPrisons();
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.region.message.submitFailed' }));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeletePrison = (event: React.MouseEvent<HTMLElement>, prison: PrisonListItem) => {
    event.stopPropagation();
    if (!prison.id || deleteSubmitting) {
      return;
    }

    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.region.deleteConfirm.prisonTitle' }),
      content: intl.formatMessage(
        { id: 'pages.region.deleteConfirm.prisonContent' },
        {
          name: prison.name || intl.formatMessage({ id: 'pages.region.fallback.unnamedPrison' }),
        }
      ),
      okText: intl.formatMessage({ id: 'pages.region.deleteConfirm.ok' }),
      cancelText: intl.formatMessage({ id: 'pages.region.action.cancel' }),
      okButtonProps: {
        danger: true,
        loading: deleteSubmitting,
      },
      onOk: async () => {
        try {
          setDeleteSubmitting(true);
          await deletePrison(prison.id as number | string);
          message.success(intl.formatMessage({ id: 'pages.region.message.prisonDeleted' }));
          refreshPrisons();
          refreshProvinceDetail();
        } catch {
          message.error(intl.formatMessage({ id: 'pages.region.message.deleteFailed' }));
          throw new Error('delete prison failed');
        } finally {
          setDeleteSubmitting(false);
        }
      },
    });
  };

  const stats = [
    {
      label: intl.formatMessage({ id: 'pages.region.field.prison' }),
      value: detail?.totalPrisons ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.device' }),
      value: detail?.totalDevices ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.online' }),
      value: detail?.onlineDevices ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.offline' }),
      value: detail?.offlineDevices ?? 0,
    },
    {
      label: intl.formatMessage({ id: 'pages.region.field.alarm' }),
      value: detail?.totalAlarms ?? 0,
    },
  ];

  return (
    <PageContainer title={false}>
      <div style={{ background: '#fff', margin: '-8px -8px 0', minHeight: 'calc(100vh - 128px)' }}>
        <Row gutter={0}>
          <Col xs={24} xl={6} style={{ overflow: 'hidden' }}>
            <div
              onClick={() => history.back()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  history.back();
                }
              }}
              role="button"
              style={{
                position: 'relative',
                height: 'calc(100vh - 128px)',
                backgroundImage: `url(${gb})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              tabIndex={0}
            >
              <div
                style={{
                  fontSize: 48,
                  color: '#111',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  WebkitTextStroke: '1px #fff',
                  textShadow: '0 0 1px #fff',
                }}
              >
                {detail?.provinceName || ''}
              </div>
            </div>
          </Col>
          <Col xs={24} xl={18}>
            <Spin spinning={detailLoading || prisonsLoading}>
              <div style={{ minHeight: 680, padding: '18px 26px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button className="soft-green-action" onClick={() => history.back()}>
                    {intl.formatMessage({ id: 'pages.region.action.back' })}
                  </Button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 16,
                    marginTop: 20,
                  }}
                >
                  {stats.map((item) => (
                    <div key={item.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '42px', lineHeight: 1.1 }}>{item.value}</div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 'clamp(18px, 2.2vw, 30px)',
                          color: '#111',
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <Divider style={{ margin: '18px 0 22px' }} />

                <List
                  grid={{ gutter: 12, xs: 1, sm: 2, md: 4, lg: 4, xl: 4, xxl: 4 }}
                  dataSource={listData}
                  renderItem={(item) => {
                    const colorIndex = Math.max((item.level ?? 1) - 1, 0) % cardColors.length;

                    return (
                      <List.Item style={{ marginBottom: 0 }}>
                        {item.__isNew ? (
                          <div
                            onClick={handleOpenModal}
                            style={{
                              minHeight: 218,
                              border: '1px solid #cdcdcd',
                              background: '#f7f7f7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              padding: '12px',
                              marginTop: '12px',
                              color: '#d7b8bd',
                            }}
                          >
                            <div style={{ fontSize: 58, lineHeight: 1, marginBottom: 8 }}>NEW</div>
                            <div style={{ fontSize: 92, lineHeight: 1, color: '#b9b9b9' }}>+</div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              if (item.id !== undefined && item.id !== null) {
                                history.push(`/region/prison/${item.id}`);
                              }
                            }}
                            style={{
                              minHeight: 218,
                              border: '1px solid #c5c5c5',
                              background: cardColors[colorIndex],
                              padding: '12px',
                              boxSizing: 'border-box',
                              marginTop: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: 12,
                                left: 24,
                              }}
                            >
                              <Button
                                className="soft-green-action"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenEditModal(item.id as number | undefined);
                                }}
                              >
                                {intl.formatMessage({ id: 'pages.region.action.edit' })}
                              </Button>
                            </div>
                            <Button
                              danger
                              icon={<CloseOutlined />}
                              loading={deleteSubmitting}
                              onClick={(event) => handleDeletePrison(event, item)}
                              style={{
                                position: 'absolute',
                                top: 6,
                                right: 12,
                                width: 28,
                                height: 28,
                                border: 'none',
                                borderRadius: 0,
                                background: 'transparent',
                              }}
                              title={intl.formatMessage({ id: 'pages.region.action.delete' })}
                              type="text"
                            />
                            <div
                              style={{
                                marginTop: 24,
                                textAlign: 'center',
                                color: '#111',
                                display: 'flex',
                                flex: 1,
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                paddingTop: 6,
                              }}
                            >
                              <div
                                style={{
                                  minHeight: 40,
                                  fontSize: '32px',
                                  lineHeight: 1.2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={
                                  item.name ||
                                  intl.formatMessage({ id: 'pages.region.fallback.unnamedPrison' })
                                }
                              >
                                {item.name ||
                                  intl.formatMessage({ id: 'pages.region.fallback.unnamedPrison' })}
                              </div>
                              <div>
                                <div style={{ fontSize: '28px', marginTop: 10 }}>
                                  {intl.formatMessage(
                                    { id: 'pages.region.label.buildingCount' },
                                    { count: item.buildingNum ?? 0 }
                                  )}
                                </div>
                                <div style={{ fontSize: '28px', marginTop: 4 }}>
                                  {intl.formatMessage(
                                    { id: 'pages.region.label.deviceCount' },
                                    { count: item.totalDevices ?? 0 }
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </List.Item>
                    );
                  }}
                />
              </div>
            </Spin>
          </Col>
        </Row>
      </div>

      <PrisonFormModal
        modalMode={modalMode}
        open={isModalOpen}
        confirmLoading={submitLoading}
        form={form}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingPrisonId(undefined);
          setEditingPrisonForm(undefined);
          form.resetFields();
        }}
      />
    </PageContainer>
  );
};

export default ProvinceDetailPage;
