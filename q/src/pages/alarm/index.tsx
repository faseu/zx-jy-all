import {
  DownloadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useRequest } from '@umijs/max';
import {
  Button,
  Col,
  DatePicker,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import React from 'react';
import OrgTree from '@/components/OrgTree';
import type { OrgTreeSelectionParams } from '@/components/OrgTree';
import type { ProvinceVO } from '../region/data.d';
import { queryProvinceList } from '../region/service';
import type { AlarmPageParams, AlarmVO, DataTAlarmVO } from './data.d';
import { queryAlarmPage, updateAlarm } from './service';
import styles from './index.less';

const alarmTypeOptionIds = [
  { labelId: 'pages.alarm.option.all', defaultLabel: 'All', value: '' },
  {
    labelId: 'pages.alarm.type.lowTemperature',
    defaultLabel: 'Low Temperature Alarm',
    value: 'Bit0',
  },
  {
    labelId: 'pages.alarm.type.overTemperature',
    defaultLabel: 'Over Temperature Alarm',
    value: 'Bit1',
  },
  { labelId: 'pages.alarm.type.overVoltage', defaultLabel: 'Over Voltage Alarm', value: 'Bit2' },
  { labelId: 'pages.alarm.type.underVoltage', defaultLabel: 'Under Voltage Alarm', value: 'Bit3' },
  { labelId: 'pages.alarm.type.overCurrent', defaultLabel: 'Over Current Alarm', value: 'Bit4' },
  { labelId: 'pages.alarm.type.underCurrent', defaultLabel: 'Under Current Alarm', value: 'Bit5' },
];

const alarmI18nByType: Record<
  string,
  {
    contentLabelId: string;
    contentDefaultLabel: string;
    suggestionLabelId: string;
    suggestionDefaultLabel: string;
  }
> = {
  '0': {
    contentLabelId: 'pages.alarm.type.lowTemperature',
    contentDefaultLabel: 'Low Temperature Alarm',
    suggestionLabelId: 'pages.alarm.suggestion.checkAmbientTemperature',
    suggestionDefaultLabel: 'Check ambient temperature',
  },
  '1': {
    contentLabelId: 'pages.alarm.type.overTemperature',
    contentDefaultLabel: 'High Temperature Alarm',
    suggestionLabelId: 'pages.alarm.suggestion.checkCooling',
    suggestionDefaultLabel: 'Check cooling',
  },
  '2': {
    contentLabelId: 'pages.alarm.type.overVoltage',
    contentDefaultLabel: 'Over Voltage Alarm',
    suggestionLabelId: 'pages.alarm.suggestion.checkPowerSupply',
    suggestionDefaultLabel: 'Check power supply',
  },
  '3': {
    contentLabelId: 'pages.alarm.type.underVoltage',
    contentDefaultLabel: 'Under Voltage Alarm',
    suggestionLabelId: 'pages.alarm.suggestion.checkPowerInput',
    suggestionDefaultLabel: 'Check power input',
  },
  '4': {
    contentLabelId: 'pages.alarm.type.overCurrent',
    contentDefaultLabel: 'Over Current Alarm',
    suggestionLabelId: 'pages.alarm.suggestion.checkLoad',
    suggestionDefaultLabel: 'Check load',
  },
  '5': {
    contentLabelId: 'pages.alarm.type.underCurrent',
    contentDefaultLabel: 'Under Current Alarm',
    suggestionLabelId: 'pages.alarm.suggestion.checkWiring',
    suggestionDefaultLabel: 'Check wiring',
  },
};

const normalizeAlarmType = (type?: string | number | null) => {
  if (type === undefined || type === null) {
    return undefined;
  }

  return String(type).replace(/^Bit/i, '');
};

const processingStatusOptionIds = [
  { labelId: 'pages.alarm.option.all', defaultLabel: 'All', value: -1 },
  { labelId: 'pages.alarm.status.unprocessed', defaultLabel: 'Unprocessed', value: 0 },
  { labelId: 'pages.alarm.status.processed', defaultLabel: 'Processed', value: 1 },
];

const blockedOptionIds = [
  { labelId: 'pages.alarm.option.all', defaultLabel: 'All', value: -1 },
  { labelId: 'pages.alarm.option.no', defaultLabel: 'No', value: 0 },
  { labelId: 'pages.alarm.option.yes', defaultLabel: 'Yes', value: 1 },
];

const EMPTY_ALARM_PAGE: DataTAlarmVO = {
  list: [],
  total: 0,
};

const getErrorMessage = (error: unknown): string | undefined =>
  (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg ||
  (error as { info?: { errorMessage?: string } })?.info?.errorMessage;

const normalizeAlarmPage = (data?: DataTAlarmVO): DataTAlarmVO => ({
  list: Array.isArray(data?.list) ? data.list : [],
  total: typeof data?.total === 'number' ? data.total : Number(data?.total ?? 0),
});

const AlarmPage: React.FC = () => {
  const intl = useIntl();
  const [pageNum, setPageNum] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [startDate, setStartDate] = React.useState<Dayjs | null>(null);
  const [endDate, setEndDate] = React.useState<Dayjs | null>(null);
  const [deviceName, setDeviceName] = React.useState('');
  const [alarmType, setAlarmType] = React.useState<string>('');
  const [processingStatus, setProcessingStatus] = React.useState<number | undefined>(0);
  const [blocked, setBlocked] = React.useState<number | undefined>(0);
  const [orgSelection, setOrgSelection] = React.useState<OrgTreeSelectionParams>({
    nodeType: 'country',
  });
  const [treePanelCollapsed, setTreePanelCollapsed] = React.useState(false);
  const [alarmLoading, setAlarmLoading] = React.useState(false);
  const [alarmPage, setAlarmPage] = React.useState<DataTAlarmVO>(EMPTY_ALARM_PAGE);
  const latestRequestIdRef = React.useRef(0);
  const t = React.useCallback(
    (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage }),
    [intl]
  );

  const alarmTypeOptions = React.useMemo(
    () =>
      alarmTypeOptionIds.map((item) => ({
        label: t(item.labelId, item.defaultLabel),
        value: item.value,
      })),
    [t]
  );
  const processingStatusOptions = React.useMemo(
    () =>
      processingStatusOptionIds.map((item) => ({
        label: t(item.labelId, item.defaultLabel),
        value: item.value,
      })),
    [t]
  );
  const blockedOptions = React.useMemo(
    () =>
      blockedOptionIds.map((item) => ({
        label: t(item.labelId, item.defaultLabel),
        value: item.value,
      })),
    [t]
  );

  const { data, loading: provinceLoading } = useRequest(queryProvinceList);

  const provinceList = (data ?? []) as ProvinceVO[];
  const alarmList = (alarmPage.list ?? []) as AlarmVO[];
  const alarmTotal = alarmPage.total ?? 0;

  const handleJumpToBuildingFloor = React.useCallback((record: AlarmVO) => {
    const fallbackPrisonId = '1';
    const fallbackBuildingId = '1';
    const nextPrisonId =
      record.prisonId !== undefined && record.prisonId !== null && record.prisonId !== ''
        ? String(record.prisonId)
        : fallbackPrisonId;
    const nextBuildingId =
      record.buildingId !== undefined && record.buildingId !== null && record.buildingId !== ''
        ? String(record.buildingId)
        : fallbackBuildingId;
    const searchParams = new URLSearchParams();

    if (record.floorId !== undefined && record.floorId !== null && record.floorId !== '') {
      searchParams.set('floorId', String(record.floorId));
    }

    history.push(
      `/region/building/${nextPrisonId}/${nextBuildingId}${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`
    );
  }, []);

  const runAlarmSearch = React.useCallback(
    async (nextPageNum: number, nextPageSize: number) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      const params: AlarmPageParams = {
        pageNum: nextPageNum,
        pageSize: nextPageSize,
      };

      if (startDate) {
        params.startDate = startDate.startOf('day').format('YYYY-MM-DD HH:mm:ss');
      }
      if (endDate) {
        params.endDate = endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss');
      }
      if (deviceName.trim()) {
        params.deviceName = deviceName.trim();
      }
      if (alarmType) {
        params.type = alarmType;
      }
      if (processingStatus !== -1) {
        params.processingStatus = processingStatus;
      }
      if (blocked !== -1) {
        params.blocked = blocked;
      }
      if (orgSelection.provinceId) {
        params.provinceId = orgSelection.provinceId;
      }
      if (orgSelection.prisonId) {
        params.prisonId = orgSelection.prisonId;
      }
      if (orgSelection.buildingId) {
        params.buildingId = orgSelection.buildingId;
      }
      if (orgSelection.floorId) {
        params.floorId = orgSelection.floorId;
      }

      try {
        setAlarmLoading(true);
        const result = await queryAlarmPage(params);
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setAlarmPage(normalizeAlarmPage(result));
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        setAlarmPage(EMPTY_ALARM_PAGE);
        message.error(
          getErrorMessage(error) ||
            t(
              'pages.alarm.message.loadFailed',
              'Failed to load alarm list. Please try again later.'
            )
        );
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setAlarmLoading(false);
        }
      }
    },
    [alarmType, blocked, deviceName, endDate, orgSelection, processingStatus, startDate, t]
  );

  const handleUpdateAlarm = React.useCallback(
    async (
      record: AlarmVO,
      payload: { processingStatus?: number; blocked?: number },
      successText: string
    ) => {
      if (record.id === undefined || record.id === null || record.id === '') {
        message.error(t('pages.alarm.message.missingAlarmId', 'Missing alarm ID.'));
        return;
      }
      if (
        !record.entireNo ||
        record.deviceId === undefined ||
        record.deviceId === null ||
        !record.deviceName
      ) {
        message.error(
          t('pages.alarm.message.missingDeviceInfo', 'Missing alarm device information.')
        );
        return;
      }

      try {
        await updateAlarm(record.id, {
          id: record.id,
          entireNo: record.entireNo,
          deviceId: record.deviceId,
          deviceName: record.deviceName,
          ...payload,
        });
        message.success(successText);
        await runAlarmSearch(pageNum, pageSize);
      } catch (error) {
        message.error(
          getErrorMessage(error) ||
            t('pages.alarm.message.operationFailed', 'Operation failed. Please try again later.')
        );
      }
    },
    [pageNum, pageSize, runAlarmSearch, t]
  );

  const columns = React.useMemo(
    () => [
      {
        title: t('pages.alarm.column.prison', 'Alarm Prison'),
        dataIndex: 'prisonName',
        render: (value?: string | null) => value || '-',
      },
      {
        title: t('pages.alarm.column.deviceId', 'Alarm Device ID'),
        dataIndex: 'deviceId',
        render: (value?: number | string) => value ?? '-',
      },
      {
        title: t('pages.alarm.column.deviceName', 'Alarm Device Name'),
        dataIndex: 'deviceName',
        render: (value?: string) => value || '-',
      },
      {
        title: t('pages.alarm.column.content', 'Alarm Content'),
        dataIndex: 'content',
        render: (value?: string, record?: AlarmVO) => {
          const alarmI18n = alarmI18nByType[normalizeAlarmType(record?.type) ?? ''];
          return alarmI18n
            ? t(alarmI18n.contentLabelId, alarmI18n.contentDefaultLabel)
            : value || '-';
        },
      },
      {
        title: t('pages.alarm.column.alarmTime', 'Alarm Time'),
        dataIndex: 'alarmTime',
        render: (value?: string) => value || '-',
      },
      {
        title: t('pages.alarm.column.suggestions', 'Troubleshooting Suggestions'),
        dataIndex: 'suggestions',
        render: (value?: string, record?: AlarmVO) => {
          const alarmI18n = alarmI18nByType[normalizeAlarmType(record?.type) ?? ''];
          return alarmI18n
            ? t(alarmI18n.suggestionLabelId, alarmI18n.suggestionDefaultLabel)
            : value || '-';
        },
      },
      {
        title: t('pages.alarm.column.action', 'Action'),
        dataIndex: 'action',
        render: (_: unknown, record: AlarmVO) => (
          <Space size="small">
            <Button type="link" onClick={() => handleJumpToBuildingFloor(record)}>
              {t('pages.alarm.action.jumpLocate', 'Locate')}
            </Button>
            <Button
              type="link"
              onClick={() =>
                handleUpdateAlarm(
                  record,
                  { processingStatus: 1 },
                  t('pages.alarm.message.clearSuccess', 'Alarm cleared.')
                )
              }
            >
              {t('pages.alarm.action.clear', 'Clear')}
            </Button>
            <Button
              type="link"
              onClick={() =>
                handleUpdateAlarm(
                  record,
                  { blocked: 1 },
                  t('pages.alarm.message.blockSuccess', 'Alarm blocked.')
                )
              }
            >
              {t('pages.alarm.action.block', 'Block')}
            </Button>
          </Space>
        ),
      },
    ],
    [handleJumpToBuildingFloor, handleUpdateAlarm, t]
  );

  React.useEffect(() => {
    runAlarmSearch(pageNum, pageSize);
  }, [pageNum, pageSize, runAlarmSearch]);

  const handleSearch = () => {
    if (pageNum !== 1) {
      setPageNum(1);
      return;
    }

    void runAlarmSearch(1, pageSize);
  };

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
                maxLevel={4}
                className={styles.orgTree}
                onSelectionChange={(params) => {
                  setOrgSelection(params);
                  if (pageNum !== 1) {
                    setPageNum(1);
                    return;
                  }
                  void runAlarmSearch(1, pageSize);
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
            <div className={styles.queryTitle}>{t('pages.alarm.query.title', 'Query Table')}</div>
            <div className={styles.queryRow}>
              <div className={styles.queryItem}>
                <span className={styles.queryLabel}>{t('pages.alarm.query.time', 'Time')}</span>
                <DatePicker
                  placeholder={t('pages.alarm.query.startDate', 'Start Date')}
                  value={startDate}
                  format="YYYY-MM-DD"
                  onChange={(value) => setStartDate(value)}
                />
                <span className={styles.middleLabel}>{t('pages.alarm.query.to', 'to')}</span>
                <DatePicker
                  placeholder={t('pages.alarm.query.endDate', 'End Date')}
                  value={endDate}
                  format="YYYY-MM-DD"
                  onChange={(value) => setEndDate(value)}
                />
              </div>
              <div className={styles.queryItem}>
                <span className={styles.queryLabel}>
                  {t('pages.alarm.query.deviceName', 'Device Name')}
                </span>
                <Input
                  value={deviceName}
                  placeholder={t('pages.alarm.query.deviceNamePlaceholder', 'Please enter')}
                  onChange={(event) => setDeviceName(event.target.value)}
                  onPressEnter={handleSearch}
                />
              </div>
              <div className={styles.queryItem}>
                <span className={styles.queryLabel}>
                  {t('pages.alarm.query.alarmType', 'Alarm Type')}
                </span>
                <Select
                  value={alarmType}
                  options={alarmTypeOptions}
                  onChange={(value) => setAlarmType(value)}
                />
              </div>
              <div className={styles.queryItem}>
                <span className={styles.queryLabel}>
                  {t('pages.alarm.query.processingStatus', 'Processing Status')}
                </span>
                <Select
                  value={processingStatus}
                  options={processingStatusOptions}
                  onChange={(value) => setProcessingStatus(value)}
                />
              </div>
              <div className={styles.queryItem}>
                <span className={styles.queryLabel}>
                  {t('pages.alarm.query.blocked', 'Blocked')}
                </span>
                <Select
                  value={blocked}
                  options={blockedOptions}
                  onChange={(value) => setBlocked(value)}
                />
              </div>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                className={styles.queryButton}
                onClick={handleSearch}
              >
                {t('pages.alarm.action.search', 'Search')}
              </Button>
            </div>
            <div className={styles.actionRow}>
              <Space size={10}>
                <Button>{t('pages.alarm.action.clearAlarm', 'Clear Alarm')}</Button>
                <Button>{t('pages.alarm.action.blockAlarm', 'Block Alarm')}</Button>
                <Button>
                  {t('pages.alarm.action.jumpDeviceMonitor', 'Jump to Device Monitor Location')}
                </Button>
              </Space>
              <Button icon={<DownloadOutlined />}>
                {t('pages.alarm.action.export', 'Export')}
              </Button>
            </div>
            <Table<AlarmVO>
              className={styles.alarmTable}
              loading={alarmLoading}
              rowKey={(record) =>
                String(
                  [
                    record.id ?? '',
                    record.prisonId ?? '',
                    record.buildingId ?? '',
                    record.floorId ?? '',
                    record.deviceId ?? '',
                    record.alarmTime ?? '',
                    record.createTime ?? '',
                  ].join('-')
                )
              }
              pagination={false}
              dataSource={alarmList}
              columns={columns}
            />
            <div className={styles.paginationRow}>
              <span className={styles.totalText}>
                {t('pages.alarm.pagination.totalPrefix', 'Total')} {alarmTotal}{' '}
                {t('pages.alarm.pagination.totalSuffix', 'items')}
              </span>
              <Pagination
                simple
                current={pageNum}
                total={alarmTotal}
                pageSize={pageSize}
                showSizeChanger={false}
                onChange={(nextPageNum, nextPageSize) => {
                  setPageNum(nextPageNum);
                  setPageSize(nextPageSize);
                }}
                itemRender={(_, type, element) => {
                  if (type === 'prev') {
                    return <span className={styles.pageArrow}>{'<'}</span>;
                  }
                  if (type === 'next') {
                    return <span className={styles.pageArrow}>{'>'}</span>;
                  }
                  return element;
                }}
              />
            </div>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default AlarmPage;
