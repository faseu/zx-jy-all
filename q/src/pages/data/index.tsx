import { PageContainer } from '@ant-design/pro-components';
import { Column, Line, Pie } from '@ant-design/plots';
import { useIntl } from '@umijs/max';
import { Button, Col, DatePicker, Row, Select, Typography } from 'antd';
import React from 'react';
import gb from '@/assets/gb.png';
import styles from './index.less';

const DataPage: React.FC = () => {
  const intl = useIntl();
  const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });
  const allOption = t('pages.data.option.all', 'All');

  const onlineStatsData = [
    { type: t('pages.data.metric.onlineTotalDuration', 'Online Total Duration'), value: 16 },
    { type: t('pages.data.metric.offlineTotalDuration', 'Offline Total Duration'), value: 48 },
    { type: t('pages.data.metric.faultOfflineDuration', 'Fault Offline Duration'), value: 36 },
  ];

  const runTimeData = [
    { name: t('pages.data.metric.averageOnlineDuration', 'Average Online Duration'), value: 800 },
    { name: t('pages.data.metric.averageOfflineDuration', 'Average Offline Duration'), value: 300 },
    { name: t('pages.data.metric.averageFaultDuration', 'Average Fault Duration'), value: 100 },
  ];

  const faultCountData = [
    { type: t('pages.data.fault.temperatureAlarm', 'Temperature Alarm'), total: 100, rate: 21 },
    { type: 'VSWR', total: 120, rate: 25 },
    { type: t('pages.data.fault.alarmBand', 'Alarm Band'), total: 70, rate: 14 },
    { type: t('pages.data.fault.powerFault', 'Power Fault'), total: 32, rate: 8 },
    {
      type: t('pages.data.fault.connectionDisconnected', 'Connection Disconnected'),
      total: 100,
      rate: 20,
    },
    { type: t('pages.data.fault.amplifierFault', 'Amplifier Fault'), total: 34, rate: 7 },
    { type: t('pages.data.fault.mainboardFault', 'Mainboard Fault'), total: 10, rate: 3 },
  ];

  const pieConfig = {
    data: onlineStatsData,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.62,
    legend: false,
    label: {
      text: (d: { type: string; value: number }) => `${d.type}\n${d.value}%`,
      position: 'spider',
      style: {
        fontSize: 12,
      },
    },
    color: ['#2F44AE', '#36B6E4', '#3990E2'],
    tooltip: {
      items: [{ channel: 'y', valueFormatter: (v: number) => `${v}%` }],
    },
  };

  const columnConfig = {
    data: runTimeData,
    xField: 'name',
    yField: 'value',
    color: '#4F81D7',
    style: { maxWidth: 52 },
    scale: {
      x: { paddingInner: 0.52, paddingOuter: 0.32 },
    },
    axis: {
      y: { grid: true },
    },
    label: {
      text: 'value',
      position: 'top',
      style: { fill: '#4F81D7', fontSize: 12 },
    },
    tooltip: {
      items: [{ channel: 'y', valueFormatter: (v: number) => `${v}` }],
    },
  };

  const lineConfig = {
    data: faultCountData,
    xField: 'type',
    yField: 'rate',
    color: '#E8792B',
    style: { maxWidth: 52, lineWidth: 3 },
    scale: {
      x: { paddingInner: 0.52, paddingOuter: 0.32 },
    },
    axis: {
      y: {
        position: 'right',
        labelFormatter: (v: string) => `${v}%`,
      },
      x: { label: false, tick: false, line: false },
    },
    point: { shapeField: 'circle', sizeField: 4 },
    tooltip: {
      items: [{ channel: 'y', valueFormatter: (v: number) => `${v}%` }],
    },
  };

  const faultColumnConfig = {
    data: faultCountData,
    xField: 'type',
    yField: 'total',
    color: '#4F81D7',
    style: { maxWidth: 52 },
    scale: {
      x: { paddingInner: 0.66, paddingOuter: 0.24 },
    },
    tooltip: {
      items: [{ channel: 'y', valueFormatter: (v: number) => `${v}` }],
    },
  };

  const allOptions = [{ value: 'all', label: allOption }];

  return (
    <PageContainer title={false}>
      <div style={{ background: '#fff', margin: '-8px -8px 0', minHeight: 'calc(100vh - 128px)' }}>
        <Row gutter={0}>
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
            />
          </Col>

          <Col xs={24} xl={18} className={styles.rightPane}>
            <div className={styles.content}>
              <div className={styles.sectionTitle}>
                {t('pages.data.searchConditions', 'Search Conditions')}
              </div>
              <div className={styles.filterRow}>
                <div className={styles.filterItemWide}>
                  <span className={styles.filterLabel}>{t('pages.data.field.time', 'Time')}</span>
                  <DatePicker.RangePicker style={{ width: '100%' }} />
                </div>
                <div className={styles.filterItem}>
                  <span className={styles.filterLabel}>
                    {t('pages.data.field.province', 'Province')}
                  </span>
                  <Select defaultValue="all" options={allOptions} style={{ width: '100%' }} />
                </div>
                <div className={styles.filterItem}>
                  <span className={styles.filterLabel}>
                    {t('pages.data.field.prison', 'Prison')}
                  </span>
                  <Select defaultValue="all" options={allOptions} style={{ width: '100%' }} />
                </div>
                <div className={styles.filterAction}>
                  <Button type="primary">{t('pages.data.action.search', 'Search')}</Button>
                </div>
              </div>

              <div className={styles.filterRowBottom}>
                <div className={styles.filterItem}>
                  <span className={styles.filterLabel}>{t('pages.data.field.floor', 'Floor')}</span>
                  <Select defaultValue="all" options={allOptions} style={{ width: '100%' }} />
                </div>
                <Button className={styles.exportBtn}>
                  {t('pages.data.action.export', 'Export')}
                </Button>
              </div>

              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <Typography.Title level={5} className={styles.chartTitle}>
                    {t('pages.data.chart.durationStatistics', 'Duration Statistics')}
                  </Typography.Title>
                  <Pie {...pieConfig} height={250} />
                </div>

                <div className={styles.chartCard}>
                  <Typography.Title level={5} className={styles.chartTitle}>
                    {t('pages.data.chart.runningDuration', 'Running Duration')}
                  </Typography.Title>
                  <Column {...columnConfig} height={250} />
                </div>
              </div>

              <div className={styles.chartCardLarge}>
                <Typography.Title level={5} className={styles.chartTitle}>
                  {t('pages.data.chart.faultTypeStatistics', 'Fault Type Statistics')}
                </Typography.Title>
                <div className={styles.combinedChart}>
                  <div className={styles.combinedColumn}>
                    <Column {...faultColumnConfig} height={240} />
                  </div>
                  <div className={styles.combinedLine}>
                    <Line {...lineConfig} height={240} />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default DataPage;
