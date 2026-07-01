import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useRequest } from '@umijs/max';
import { Button, Col, Pagination, Row, Select, Table, message } from 'antd';
import React from 'react';
import gb from '@/assets/gb.png';
import type { ProvinceVO } from '../region/data.d';
import { queryProvinceList } from '../region/service';
import { formatAction, formatLogContent, formatModule } from './dictionaries';
import styles from './index.less';
import type { OperLogRecord, PageData } from './service';
import { queryOperLogPage } from './service';

const EMPTY_LOG_PAGE: PageData<OperLogRecord> = {
  list: [],
  total: 0,
};

const prisonLevelOptionIds = [
  { labelId: 'pages.log.option.all', defaultLabel: 'All', value: '' },
  { labelId: 'pages.region.prisonLevel.loose', defaultLabel: 'Loose management prison', value: 1 },
  { labelId: 'pages.region.prisonLevel.normal', defaultLabel: 'Standard management prison', value: 2 },
  { labelId: 'pages.region.prisonLevel.strict', defaultLabel: 'Strict management prison', value: 3 },
];

const normalizeProvinceList = (data: unknown): ProvinceVO[] => {
  if (Array.isArray(data)) {
    return data as ProvinceVO[];
  }

  const innerData = (data as { data?: ProvinceVO[] } | undefined)?.data;
  return Array.isArray(innerData) ? innerData : [];
};

type LogIntl = ReturnType<typeof useIntl>;

const downloadCsv = (rows: OperLogRecord[], filename: string, intl: LogIntl) => {
  const headers = ['Username', 'Login Time', 'Module', 'Action Type', 'Action', 'Operation Time'];
  const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) =>
      [
        row.createBy,
        row.loginTime,
        formatModule(intl, row.moduleCode),
        formatAction(intl, row.actionCode),
        formatLogContent(intl, row),
        row.operateTime,
      ]
        .map(escapeCell)
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const LogPage: React.FC = () => {
  const intl = useIntl();
  const [pageNum, setPageNum] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [provinceId, setProvinceId] = React.useState<string>('');
  const [prisonLevel, setPrisonLevel] = React.useState<string>('');
  const [logPage, setLogPage] = React.useState<PageData<OperLogRecord>>(EMPTY_LOG_PAGE);
  const [logLoading, setLogLoading] = React.useState(false);
  const latestRequestIdRef = React.useRef(0);

  const t = React.useCallback(
    (id: string, defaultMessage: string, values?: Record<string, string | number>) =>
      intl.formatMessage({ id, defaultMessage }, values),
    [intl]
  );

  const allOption = t('pages.log.option.all', 'All');
  const { data: provinceData } = useRequest(queryProvinceList);
  const provinceList = normalizeProvinceList(provinceData);
  const provinceOptions = React.useMemo(
    () => [
      { label: allOption, value: '' },
      ...provinceList
        .filter((item) => item.provinceId !== undefined && item.provinceId !== null)
        .map((item) => ({
          label: item.provinceName ?? String(item.provinceId),
          value: String(item.provinceId),
        })),
    ],
    [allOption, provinceList]
  );
  const prisonLevelOptions = React.useMemo(
    () =>
      prisonLevelOptionIds.map((item) => ({
        label: item.value === '' ? allOption : t(item.labelId, item.defaultLabel),
        value: String(item.value),
      })),
    [allOption, t]
  );

  const runLogSearch = React.useCallback(
    async (nextPageNum: number, nextPageSize: number) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      setLogLoading(true);

      try {
        const result = await queryOperLogPage({
          pageNum: nextPageNum,
          pageSize: nextPageSize,
          provinceId: provinceId || undefined,
          prisonLevel: prisonLevel || undefined,
        });

        if (requestId === latestRequestIdRef.current) {
          setLogPage(result);
          setPageNum(nextPageNum);
          setPageSize(nextPageSize);
        }
      } catch (error) {
        if (requestId === latestRequestIdRef.current) {
          message.error(t('pages.log.message.loadFailed', 'Failed to load operation logs.'));
          setLogPage(EMPTY_LOG_PAGE);
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setLogLoading(false);
        }
      }
    },
    [prisonLevel, provinceId, t]
  );

  React.useEffect(() => {
    void runLogSearch(1, pageSize);
  }, []);

  const handleSearch = () => {
    void runLogSearch(1, pageSize);
  };

  const logList = logPage.list ?? [];
  const logTotal = logPage.total ?? 0;

  return (
    <PageContainer title={false}>
      <div className={styles.pageShell}>
        <Row gutter={0} className={styles.contentRow}>
          <Col xs={24} xl={6} className={styles.leftImagePane}>
            <div className={styles.leftImage} style={{ backgroundImage: `url(${gb})` }} />
          </Col>

          <Col xs={24} xl={18} className={styles.rightPane}>
            <div className={styles.rightScrollArea}>
              <div className={styles.queryTitle}>{t('pages.log.query.title', 'Query Table')}</div>
              <div className={styles.queryRow}>
                <div className={styles.queryItem}>
                  <span className={styles.queryLabel}>
                    {t('pages.log.field.province', 'Province')}
                  </span>
                  <Select value={provinceId} options={provinceOptions} onChange={setProvinceId} />
                </div>
                <div className={styles.queryItem}>
                  <span className={styles.queryLabel}>
                    {t('pages.log.field.prisonLevel', 'Prison Level')}
                  </span>
                  <Select value={prisonLevel} options={prisonLevelOptions} onChange={setPrisonLevel} />
                </div>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  className={styles.queryButton}
                  loading={logLoading}
                  onClick={handleSearch}
                >
                  {t('pages.log.action.search', 'Search')}
                </Button>
              </div>
              <div className={styles.actionRow}>
                <div />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => downloadCsv(logList, `operation-logs-${Date.now()}.csv`, intl)}
                >
                  {t('pages.log.action.export', 'Export')}
                </Button>
              </div>
              <Table<OperLogRecord>
                className={styles.alarmTable}
                rowKey={(record) => String(record.id)}
                pagination={false}
                loading={logLoading}
                dataSource={logList}
                scroll={{ x: 1120 }}
                columns={[
                  {
                    title: t('pages.log.column.username', 'Username'),
                    dataIndex: 'createBy',
                    width: 120,
                  },
                  {
                    title: t('pages.log.column.loginTime', 'Login Time'),
                    dataIndex: 'loginTime',
                    width: 170,
                  },
                  {
                    title: t('pages.log.column.module', 'Module'),
                    dataIndex: 'moduleCode',
                    width: 120,
                    render: (_, record) => formatModule(intl, record.moduleCode),
                  },
                  {
                    title: t('pages.log.column.actionType', 'Action Type'),
                    dataIndex: 'actionCode',
                    width: 120,
                    render: (_, record) => formatAction(intl, record.actionCode),
                  },
                  {
                    title: t('pages.log.column.action', 'Action'),
                    dataIndex: 'content',
                    width: 260,
                    render: (_, record) => formatLogContent(intl, record),
                  },
                  {
                    title: t('pages.log.column.path', 'Path'),
                    dataIndex: 'path',
                    width: 200,
                  },
                  {
                    title: t('pages.log.column.operationTime', 'Operation Time'),
                    dataIndex: 'operateTime',
                    width: 170,
                  },
                ]}
              />
              <div className={styles.paginationRow}>
                <span className={styles.totalText}>
                  {t('pages.log.pagination.totalPrefix', 'Total')} {logTotal}{' '}
                  {t('pages.log.pagination.totalSuffix', 'items')}
                </span>
                <Pagination
                  simple
                  current={pageNum}
                  total={logTotal}
                  pageSize={pageSize}
                  showSizeChanger={false}
                  onChange={(nextPage, nextPageSize) => {
                    void runLogSearch(nextPage, nextPageSize);
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
            </div>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default LogPage;
