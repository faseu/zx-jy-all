import { useIntl } from '@umijs/max';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Slider,
  Steps,
  Switch,
  TimePicker,
  message,
} from 'antd';
import type { FormInstance } from 'antd';
import React from 'react';
import dayjs from 'dayjs';
import shielder from '@/assets/shielder.png';
import { getDeviceInfoByEntireNo } from '../service';

type OptionItem = {
  label: React.ReactNode;
  value: number;
};

type EditDeviceModalProps = {
  open: boolean;
  step: number;
  form: FormInstance;
  powerChannelKeys: string[];
  powerChannelValues: Record<string, number>;
  prisonOptions: OptionItem[];
  buildingOptions: OptionItem[];
  floorOptions: OptionItem[];
  deviceBuildingsLoading: boolean;
  prisonDisabled?: boolean;
  buildingDisabled?: boolean;
  floorDisabled?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
  onPrisonChange: (value: number | null) => void;
  onBuildingChange: (value: number | null) => void;
  onPowerChannelChange: (key: string, value: number) => void;
};

const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  open,
  step,
  form,
  powerChannelKeys,
  powerChannelValues,
  prisonOptions,
  buildingOptions,
  floorOptions,
  deviceBuildingsLoading,
  prisonDisabled = true,
  buildingDisabled = true,
  floorDisabled = true,
  submitting = false,
  onCancel,
  onNext,
  onPrev,
  onFinish,
  onPrisonChange,
  onBuildingChange,
  onPowerChannelChange,
}) => {
  const intl = useIntl();
  const [testingConnection, setTestingConnection] = React.useState(false);

  const handleSetAllDay = () => {
    form.setFieldsValue({
      startTime: dayjs('00:00', 'HH:mm'),
      stopTime: dayjs('00:00', 'HH:mm'),
    });
  };

  const handleTestConnection = async () => {
    try {
      const { networkCode } = await form.validateFields(['networkCode']);
      if (!networkCode) {
        return;
      }

      setTestingConnection(true);
      const result = await getDeviceInfoByEntireNo(networkCode);

      if (result?.code === '00000') {
        message.success(intl.formatMessage({ id: 'pages.region.message.connectionSuccess' }));
        return;
      }

      if (result?.code === 'B0001') {
        message.error(intl.formatMessage({ id: 'pages.region.message.connectionFailed' }));
        return;
      }

      message.error(
        result?.msg || intl.formatMessage({ id: 'pages.region.message.connectionTestFailed' })
      );
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(intl.formatMessage({ id: 'pages.region.message.connectionTestFailed' }));
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'pages.region.modal.editDevice' })}
      open={open}
      onCancel={onCancel}
      width={1000}
      footer={
        step === 0
          ? [
              <Button key="cancel" onClick={onCancel}>
                {intl.formatMessage({ id: 'pages.region.action.cancel' })}
              </Button>,
              <Button key="next" type="primary" onClick={onNext}>
                {intl.formatMessage({ id: 'pages.region.action.next' })}
              </Button>,
            ]
          : [
              <Button key="prev" onClick={onPrev}>
                {intl.formatMessage({ id: 'pages.region.action.prev' })}
              </Button>,
              <Button key="finish" type="primary" loading={submitting} onClick={onFinish}>
                {intl.formatMessage({ id: 'pages.region.action.save' })}
              </Button>,
            ]
      }
    >
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ flex: '120px' }}
        wrapperCol={{ flex: 1 }}
        initialValues={{ powerOff: true }}
      >
        <Row gutter={16}>
          <Col
            flex="180px"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                height: 160,
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(0,0,0,0.45)',
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              <img src={shielder} alt="" width={164} height={164} />
            </div>
            <Form.Item name="powerOff" valuePropName="checked">
              <Switch
                checkedChildren={intl.formatMessage({ id: 'pages.region.status.on' })}
                unCheckedChildren={intl.formatMessage({ id: 'pages.region.status.off' })}
              />
            </Form.Item>
          </Col>

          <Col flex="1">
            <Steps
              size="small"
              current={step}
              items={[
                { title: intl.formatMessage({ id: 'pages.region.step.basicInfo' }) },
                { title: intl.formatMessage({ id: 'pages.region.step.otherInfo' }) },
              ]}
              style={{ marginBottom: 16 }}
            />

            {step === 0 ? (
              <>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.prison' })}
                  name="prisonId"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.region.validation.prison' }),
                    },
                  ]}
                >
                  <Select
                    options={prisonOptions}
                    disabled={prisonDisabled}
                    onChange={(value) => onPrisonChange(value ?? null)}
                    placeholder={intl.formatMessage({ id: 'pages.region.validation.prison' })}
                  />
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.building' })}
                  name="buildingId"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.region.validation.building' }),
                    },
                  ]}
                >
                  <Select
                    options={buildingOptions}
                    onChange={(value) => onBuildingChange(value ?? null)}
                    placeholder={intl.formatMessage({ id: 'pages.region.validation.building' })}
                    loading={deviceBuildingsLoading}
                    disabled={buildingDisabled}
                    notFoundContent={
                      deviceBuildingsLoading
                        ? intl.formatMessage({ id: 'pages.region.status.loading' })
                        : intl.formatMessage({ id: 'pages.region.status.noBuilding' })
                    }
                  />
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.floor' })}
                  name="floorId"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.region.validation.floor' }),
                    },
                  ]}
                >
                  <Select
                    options={floorOptions}
                    placeholder={intl.formatMessage({ id: 'pages.region.validation.floor' })}
                    disabled={floorDisabled}
                  />
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.deviceCode' })}
                  name="deviceCode"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.region.validation.deviceCode' }),
                    },
                  ]}
                >
                  <Input
                    placeholder={intl.formatMessage({ id: 'pages.region.validation.deviceCode' })}
                  />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.networkCode' })}
                  required
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Item
                      name="networkCode"
                      noStyle
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: 'pages.region.validation.networkCode',
                          }),
                        },
                      ]}
                    >
                      <Input
                        placeholder={intl.formatMessage({
                          id: 'pages.region.validation.networkCode',
                        })}
                      />
                    </Form.Item>
                    <Button type="link" onClick={handleTestConnection} loading={testingConnection}>
                      {intl.formatMessage({ id: 'pages.region.action.connectionTest' })}
                    </Button>
                  </div>
                </Form.Item>
                <Form.Item label="IP" required>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Form.Item
                      name="ip"
                      noStyle
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({ id: 'pages.region.validation.ip' }),
                        },
                      ]}
                    >
                      <Input
                        placeholder={intl.formatMessage({ id: 'pages.region.validation.ip' })}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.port' })}
                  name="port"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.region.validation.port' }),
                    },
                  ]}
                >
                  <InputNumber min={0} max={65535} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: 'pages.region.field.powerAdjust' })}>
                  <Row gutter={[12, 8]}>
                    {powerChannelKeys.map((key, index) => (
                      <Col span={8} key={key}>
                        <Form.Item
                          name={key}
                          label={`CH${index + 1}`}
                          labelCol={{ flex: '40px' }}
                          wrapperCol={{ flex: 1 }}
                          style={{ marginBottom: 0 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ minWidth: 24, textAlign: 'right' }}>
                              {powerChannelValues[key] ?? 0}
                            </span>
                            <Slider
                              min={0}
                              max={100}
                              style={{ flex: 1, margin: 0 }}
                              tooltip={{ open: false }}
                              onChange={(value) => {
                                const nextValue = Array.isArray(value) ? value[0] : value;
                                onPowerChannelChange(key, nextValue);
                              }}
                            />
                          </div>
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.startTime' })}
                  required
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Form.Item
                      name="startTime"
                      noStyle
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({ id: 'pages.region.validation.startTime' }),
                        },
                      ]}
                    >
                      <TimePicker format="HH:mm" style={{ width: '100%', flex: 1 }} />
                    </Form.Item>
                    <Button onClick={handleSetAllDay}>
                      {intl.formatMessage({ id: 'pages.region.action.allDay' })}
                    </Button>
                  </div>
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: 'pages.region.field.stopTime' })}
                  required
                >
                  <Form.Item
                    name="stopTime"
                    noStyle
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({ id: 'pages.region.validation.stopTime' }),
                      },
                    ]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Form.Item>
              </>
            )}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditDeviceModal;
