import { CheckOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, Radio } from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';
import type { PrisonFormVO } from '../data.d';

type PrisonFormModalProps = {
  modalMode: 'create' | 'edit';
  open: boolean;
  confirmLoading: boolean;
  form: FormInstance<PrisonFormVO>;
  onOk: () => void;
  onCancel: () => void;
};

const PrisonFormModal: React.FC<PrisonFormModalProps> = ({
  modalMode,
  open,
  confirmLoading,
  form,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();
  const selectedLevel = Form.useWatch('level', form);
  const levelOptions = [
    {
      value: 1,
      color: '#cae9f8',
      borderColor: '#5aa9d6',
      label: intl.formatMessage({ id: 'pages.region.prisonLevel.loose' }),
    },
    {
      value: 2,
      color: '#f0dd93',
      borderColor: '#c49b2f',
      label: intl.formatMessage({ id: 'pages.region.prisonLevel.normal' }),
    },
    {
      value: 3,
      color: '#e8c0c9',
      borderColor: '#c16b7e',
      label: intl.formatMessage({ id: 'pages.region.prisonLevel.strict' }),
    },
  ];

  return (
    <Modal
      title={intl.formatMessage({
        id: modalMode === 'edit' ? 'pages.region.modal.editPrison' : 'pages.region.modal.addPrison',
      })}
      open={open}
      confirmLoading={confirmLoading}
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={intl.formatMessage({ id: 'pages.region.field.prisonLevel' })}
          name="level"
        >
          <Radio.Group buttonStyle="solid" optionType="button">
            {levelOptions.map((option) => {
              const checked = Number(selectedLevel) === option.value;

              return (
                <Radio.Button
                  key={option.value}
                  style={{
                    minWidth: 86,
                    background: option.color,
                    borderColor: checked ? option.borderColor : undefined,
                    boxShadow: checked ? `inset 0 0 0 1px ${option.borderColor}` : undefined,
                    color: '#10263f',
                    fontWeight: checked ? 600 : 400,
                  }}
                  value={option.value}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {option.label}
                    {checked ? (
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          border: `1px solid ${option.borderColor}`,
                          color: option.borderColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          lineHeight: 1,
                        }}
                      >
                        <CheckOutlined />
                      </span>
                    ) : null}
                  </span>
                </Radio.Button>
              );
            })}
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.region.field.prisonName' })}
          name="name"
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'pages.region.validation.prisonName' }),
            },
          ]}
        >
          <Input placeholder={intl.formatMessage({ id: 'pages.region.validation.prisonName' })} />
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.region.field.roomNumber' })}
          name="roomNumber"
          rules={[
            {
              required: true,
              message: intl.formatMessage({ id: 'pages.region.validation.roomNumber' }),
            },
          ]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder={intl.formatMessage({ id: 'pages.region.validation.roomNumber' })}
          />
        </Form.Item>
        <Form.Item name="deptId" hidden>
          <InputNumber />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PrisonFormModal;
