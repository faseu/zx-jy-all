import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';
import type { BuildingFormVO } from '../data.d';

type BuildingFormModalProps = {
  modalMode: 'create' | 'edit';
  open: boolean;
  confirmLoading: boolean;
  form: FormInstance<BuildingFormVO>;
  onOk: () => void;
  onCancel: () => void;
};

const BuildingFormModal: React.FC<BuildingFormModalProps> = ({
  modalMode,
  open,
  confirmLoading,
  form,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={intl.formatMessage({
        id:
          modalMode === 'edit'
            ? 'pages.region.modal.editBuilding'
            : 'pages.region.modal.addBuilding',
      })}
      open={open}
      confirmLoading={confirmLoading}
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={intl.formatMessage({ id: 'pages.region.field.buildingName' })}
          name="name"
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'pages.region.validation.buildingName' }),
            },
          ]}
        >
          <Input placeholder={intl.formatMessage({ id: 'pages.region.validation.buildingName' })} />
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.region.field.groundFloorNum' })}
          name="groundFloorNum"
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'pages.region.validation.groundFloorNum' }),
            },
          ]}
        >
          <InputNumber
            placeholder={intl.formatMessage({ id: 'pages.region.validation.groundFloorNum' })}
            style={{ width: '100%' }}
            min={0}
            precision={0}
          />
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.region.field.undergroundFloorNum' })}
          name="undergroundFloorNum"
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'pages.region.validation.undergroundFloorNum' }),
            },
          ]}
        >
          <InputNumber
            placeholder={intl.formatMessage({ id: 'pages.region.validation.undergroundFloorNum' })}
            style={{ width: '100%' }}
            min={0}
            precision={0}
          />
        </Form.Item>
        <Form.Item name="prisonId" hidden>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BuildingFormModal;
