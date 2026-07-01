import { useIntl, useRequest } from '@umijs/max';
import { Button, message, Modal, Slider, Spin, Switch } from 'antd';
import React from 'react';
import { disableDevices, enableDevices } from '../../machine/service';
import type { DeviceFormVO, DeviceStatusVO } from '../data.d';
import {
  batchSetRfSwitch,
  getDeviceStatusByEntireNo,
  queryDeviceForm,
  updateDeviceChannels,
} from '../service';

type DeviceDetailModalProps = {
  open: boolean;
  deviceId: number | null;
  onCancel: () => void;
};

const CHANNEL_KEYS = Array.from(
  { length: 18 },
  (_, index) => `ch${index + 1}` as keyof DeviceFormVO
);

const valueOrDash = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
};

const parseChannelValue = (value?: string | number | null) => {
  const resolved = Number(value);

  if (!Number.isFinite(resolved)) {
    return 0;
  }

  return Math.max(0, Math.min(100, resolved));
};

const isChannelEnabled = (channelStates: number, channel: number) =>
  (channelStates & (1 << (channel - 1))) !== 0;

const FieldRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
    <div style={{ width: 88, textAlign: 'right', fontSize: 16, fontWeight: 400, color: '#000' }}>
      {label}:
    </div>
    <div style={{ marginLeft: 18, fontSize: 22, fontWeight: 400, color: '#000' }}>{value}</div>
  </div>
);

const ChannelRow: React.FC<{
  label: string;
  switchChecked?: boolean;
  switchLoading?: boolean;
  value: number;
  onChange: (nextValue: number) => void;
  onSwitchChange: (checked: boolean) => void;
}> = ({ label, switchChecked, switchLoading, value, onChange, onSwitchChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
    <div style={{ width: 88, textAlign: 'right', fontSize: 16, fontWeight: 400, color: '#000' }}>
      {label}:
    </div>
    <div style={{ marginLeft: 18, flex: 1, paddingRight: 18 }}>
      <Slider value={value} min={0} max={100} tooltip={{ open: false }} onChange={onChange} />
    </div>
    <Switch
      size="small"
      checked={Boolean(switchChecked)}
      loading={switchLoading}
      onChange={onSwitchChange}
    />
  </div>
);

const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ open, deviceId, onCancel }) => {
  const intl = useIntl();
  const [channelValues, setChannelValues] = React.useState<Record<string, number>>({});
  const [channelSwitchValues, setChannelSwitchValues] = React.useState<Record<string, boolean>>({});
  const [powerSubmitting, setPowerSubmitting] = React.useState(false);
  const [channelSubmitting, setChannelSubmitting] = React.useState(false);
  const [switchSubmitting, setSwitchSubmitting] = React.useState<Record<string, boolean>>({});
  const { data, loading, run } = useRequest((id: number) => queryDeviceForm(id), {
    manual: true,
  });
  const {
    data: statusData,
    loading: statusLoading,
    run: runStatus,
  } = useRequest((entireNo: string) => getDeviceStatusByEntireNo(entireNo), {
    manual: true,
  });

  React.useEffect(() => {
    if (!open || !deviceId) {
      return;
    }

    run(deviceId);
  }, [deviceId, open, run]);

  const detail = ((data as { data?: DeviceFormVO } | undefined)?.data ??
    data ??
    {}) as DeviceFormVO;
  const status = ((statusData as { data?: DeviceStatusVO } | undefined)?.data ??
    statusData ??
    {}) as DeviceStatusVO;
  const entireNo = detail.entireNo;

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setChannelValues(
      Object.fromEntries(
        CHANNEL_KEYS.map((key) => [key, parseChannelValue(detail[key] as string | number | null)])
      )
    );
  }, [detail, open]);

  React.useEffect(() => {
    if (!open || !entireNo) {
      return;
    }

    runStatus(entireNo);
  }, [entireNo, open, runStatus]);

  React.useEffect(() => {
    if (!open || status.channelStates === undefined) {
      return;
    }

    setChannelSwitchValues(
      Object.fromEntries(
        CHANNEL_KEYS.map((_, index) => [
          String(index + 1),
          isChannelEnabled(Number(status.channelStates), index + 1),
        ])
      )
    );
  }, [open, status.channelStates]);

  const handlePowerChange = React.useCallback(
    async (checked: boolean) => {
      if (!deviceId || powerSubmitting) {
        return;
      }

      try {
        setPowerSubmitting(true);

        if (checked) {
          await enableDevices([deviceId]);
          message.success(intl.formatMessage({ id: 'pages.region.message.powerOn' }));
        } else {
          await disableDevices([deviceId]);
          message.success(intl.formatMessage({ id: 'pages.region.message.powerOff' }));
        }

        await run(deviceId);
      } catch {
        message.error(intl.formatMessage({ id: 'pages.region.message.powerUpdateFailed' }));
      } finally {
        setPowerSubmitting(false);
      }
    },
    [deviceId, intl, powerSubmitting, run]
  );

  const handleChannelChange = React.useCallback((key: string, value: number) => {
    setChannelValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleChannelSwitchChange = React.useCallback(
    async (channel: number, checked: boolean) => {
      if (!entireNo || switchSubmitting[String(channel)]) {
        return;
      }

      try {
        setSwitchSubmitting((prev) => ({ ...prev, [String(channel)]: true }));
        await batchSetRfSwitch(entireNo, String(channel), checked ? 1 : 0);
        setChannelSwitchValues((prev) => ({ ...prev, [String(channel)]: checked }));
        message.success(`CH${channel}${checked ? '已开启' : '已关闭'}`);
        window.setTimeout(() => runStatus(entireNo), 1200);
      } catch {
        message.error(`CH${channel}开关设置失败`);
      } finally {
        setSwitchSubmitting((prev) => {
          const next = { ...prev };
          delete next[String(channel)];
          return next;
        });
      }
    },
    [entireNo, runStatus, switchSubmitting]
  );

  const handleChannelSave = React.useCallback(async () => {
    if (!deviceId || channelSubmitting) {
      return;
    }

    try {
      setChannelSubmitting(true);

      await updateDeviceChannels(
        deviceId,
        CHANNEL_KEYS.reduce(
          (acc, key) => {
            acc[key] = channelValues[key] ?? 0;
            return acc;
          },
          {} as Record<string, number>
        )
      );

      message.success(intl.formatMessage({ id: 'pages.region.message.channelSaved' }));
      await run(deviceId);
    } catch {
      message.error(intl.formatMessage({ id: 'pages.region.message.channelSaveFailed' }));
    } finally {
      setChannelSubmitting(false);
    }
  }, [channelSubmitting, channelValues, deviceId, intl, run]);

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
          {intl.formatMessage({ id: 'pages.region.modal.deviceDetail' })}
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          key="refresh"
          loading={statusLoading}
          disabled={!entireNo}
          onClick={() => entireNo && runStatus(entireNo)}
        >
          刷新实时状态
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          {intl.formatMessage({ id: 'pages.region.action.close' })}
        </Button>,
        <Button key="save" type="primary" loading={channelSubmitting} onClick={handleChannelSave}>
          {intl.formatMessage({ id: 'pages.region.action.saveChannelConfig' })}
        </Button>,
      ]}
      width={1200}
      destroyOnClose
      centered
      maskClosable={false}
    >
      <Spin spinning={loading}>
        <div style={{ padding: '36px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              columnGap: 64,
              marginBottom: 14,
            }}
          >
            <div>
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.locatedBuilding' })}
                value={valueOrDash(detail.buildingName)}
              />
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.networkCode' })}
                value={valueOrDash(detail.entireNo)}
              />
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.voltage' })}
                value={valueOrDash(detail.voltage)}
              />
            </div>
            <div>
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.locatedFloor' })}
                value={valueOrDash(detail.floorName)}
              />
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.deviceName' })}
                value={valueOrDash(detail.deviceName)}
              />
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.current' })}
                value={valueOrDash(detail.electric_current)}
              />
            </div>
            <div>
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.deviceCode' })}
                value={valueOrDash(detail.deviceNo)}
              />
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.power' })}
                value={
                  <Switch
                    size="small"
                    checked={Number(detail.powerOff) === 0}
                    loading={powerSubmitting}
                    onChange={handlePowerChange}
                  />
                }
              />
              <FieldRow
                label={intl.formatMessage({ id: 'pages.region.field.rf' })}
                value={valueOrDash(detail.radio_frequency)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 64 }}>
            <div>
              {[1, 4, 7, 10, 13, 16].map((channel) => (
                <ChannelRow
                  key={channel}
                  label={`CH${channel}`}
                  switchChecked={channelSwitchValues[String(channel)]}
                  switchLoading={switchSubmitting[String(channel)]}
                  value={channelValues[`ch${channel}`] ?? 0}
                  onChange={(value) => handleChannelChange(`ch${channel}`, value)}
                  onSwitchChange={(checked) => handleChannelSwitchChange(channel, checked)}
                />
              ))}
            </div>
            <div>
              {[2, 5, 8, 11, 14, 17].map((channel) => (
                <ChannelRow
                  key={channel}
                  label={`CH${channel}`}
                  switchChecked={channelSwitchValues[String(channel)]}
                  switchLoading={switchSubmitting[String(channel)]}
                  value={channelValues[`ch${channel}`] ?? 0}
                  onChange={(value) => handleChannelChange(`ch${channel}`, value)}
                  onSwitchChange={(checked) => handleChannelSwitchChange(channel, checked)}
                />
              ))}
            </div>
            <div>
              {[3, 6, 9, 12, 15, 18].map((channel) => (
                <ChannelRow
                  key={channel}
                  label={`CH${channel}`}
                  switchChecked={channelSwitchValues[String(channel)]}
                  switchLoading={switchSubmitting[String(channel)]}
                  value={channelValues[`ch${channel}`] ?? 0}
                  onChange={(value) => handleChannelChange(`ch${channel}`, value)}
                  onSwitchChange={(checked) => handleChannelSwitchChange(channel, checked)}
                />
              ))}
            </div>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default DeviceDetailModal;
