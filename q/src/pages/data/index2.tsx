import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Column, Line, Pie } from '@ant-design/plots';
import { useIntl } from '@umijs/max';
import { Button, Card, Col, DatePicker, Divider, Form, Row, Select } from 'antd';
import React from 'react';

type PieLabelDatum = {
  type: string;
  percent: number;
};

const DataPage: React.FC = () => {
  const intl = useIntl();
  const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });

  const timeStatsData = [
    { type: t('pages.data.metric.onlineTotalDuration', 'Online Total Duration'), value: 16 },
    { type: t('pages.data.metric.offlineTotalDuration', 'Offline Total Duration'), value: 48 },
    { type: t('pages.data.metric.faultTotalDuration', 'Fault Total Duration'), value: 36 },
  ];

  const runningTimeData = [
    { type: t('pages.data.metric.averageOnlineDuration', 'Average Online Duration'), value: 800 },
    { type: t('pages.data.metric.averageOfflineDuration', 'Average Offline Duration'), value: 300 },
    { type: t('pages.data.metric.averageFaultDuration', 'Average Fault Duration'), value: 100 },
  ];

  const faultTypeData = [
    { type: t('pages.data.fault.temperatureAlarm', 'Temperature Alarm'), value: 100 },
    { type: 'VSWR', value: 130 },
    { type: t('pages.data.fault.alarmBand', 'Alarm Band'), value: 70 },
    { type: t('pages.data.fault.powerFault', 'Power Fault'), value: 40 },
    { type: t('pages.data.fault.connectionDisconnected', 'Connection Disconnected'), value: 95 },
    { type: t('pages.data.fault.amplifierFault', 'Amplifier Fault'), value: 35 },
    { type: t('pages.data.fault.mainboardFault', 'Mainboard Fault'), value: 10 },
  ];

  const faultTypeRatio = [
    { type: t('pages.data.fault.temperatureAlarm', 'Temperature Alarm'), ratio: 0.22 },
    { type: 'VSWR', ratio: 0.26 },
    { type: t('pages.data.fault.alarmBand', 'Alarm Band'), ratio: 0.15 },
    { type: t('pages.data.fault.powerFault', 'Power Fault'), ratio: 0.08 },
    { type: t('pages.data.fault.connectionDisconnected', 'Connection Disconnected'), ratio: 0.21 },
    { type: t('pages.data.fault.amplifierFault', 'Amplifier Fault'), ratio: 0.07 },
    { type: t('pages.data.fault.mainboardFault', 'Mainboard Fault'), ratio: 0.03 },
  ];

  const faultTypeLineData = [
    ...faultTypeData.map((item) => ({
      type: item.type,
      metric: t('pages.data.metric.totalDuration', 'Total Duration'),
      value: item.value,
    })),
    ...faultTypeRatio.map((item) => ({
      type: item.type,
      metric: t('pages.data.metric.ratio', 'Ratio'),
      value: Math.round(item.ratio * 100),
    })),
  ];

  const allOption = t('pages.data.option.all', 'All');

  return (
    <PageContainer title={false}>
      <Card title={t('pages.data.searchConditions', 'Search Conditions')} size="small">
        <Form layout="inline">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <Form.Item label={t('pages.data.field.time', 'Time')} name="range">
              <DatePicker.RangePicker
                placeholder={[
                  t('pages.data.placeholder.startDate', 'Start Date'),
                  t('pages.data.placeholder.endDate', 'End Date'),
                ]}
                separator={t('pages.data.field.to', 'to')}
              />
            </Form.Item>
            <Form.Item label={t('pages.data.field.province', 'Province')} name="province">
              <Select
                style={{ width: 160 }}
                placeholder={allOption}
                options={[
                  { label: allOption, value: 'all' },
                  { label: t('pages.data.demoProvince.hebei', 'Hebei Province'), value: 'hebei' },
                  {
                    label: t('pages.data.demoProvince.shandong', 'Shandong Province'),
                    value: 'shandong',
                  },
                ]}
              />
            </Form.Item>
            <Form.Item label={t('pages.data.field.prison', 'Prison')} name="prison">
              <Select
                style={{ width: 160 }}
                placeholder={allOption}
                options={[
                  { label: allOption, value: 'all' },
                  {
                    label: t('pages.data.demoPrison.shijiazhuang', 'Shijiazhuang Prison'),
                    value: 'sjz',
                  },
                  { label: t('pages.data.demoPrison.jinan', 'Jinan Prison'), value: 'jn' },
                ]}
              />
            </Form.Item>
            <Form.Item label={t('pages.data.field.floor', 'Floor')} name="floor">
              <Select
                style={{ width: 160 }}
                placeholder={allOption}
                options={[
                  { label: allOption, value: 'all' },
                  { label: t('pages.data.demoFloor.first', 'Floor 1'), value: '1' },
                  { label: t('pages.data.demoFloor.second', 'Floor 2'), value: '2' },
                ]}
              />
            </Form.Item>
            <Button type="primary" icon={<SearchOutlined />}>
              {t('pages.data.action.search', 'Search')}
            </Button>
          </div>
        </Form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Button icon={<DownloadOutlined />}>{t('pages.data.action.export', 'Export')}</Button>
        </div>
      </Card>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('pages.data.chart.durationStatistics', 'Duration Statistics')}>
            <Pie
              height={260}
              data={timeStatsData}
              angleField="value"
              colorField="type"
              radius={1}
              innerRadius={0.62}
              label={{
                type: 'outer',
                content: (datum: PieLabelDatum) =>
                  `${datum.type} ${Math.round(datum.percent * 100)}%`,
              }}
              legend={false}
              color={['#1f9eff', '#19c1ff', '#2b3aa9']}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('pages.data.chart.runningDuration', 'Running Duration')}>
            <Column
              height={260}
              data={runningTimeData}
              xField="type"
              yField="value"
              color="#4b78f2"
              label={{ position: 'top', style: { fill: '#4b78f2', fontWeight: 600 } }}
              xAxis={{ label: { autoHide: false, autoRotate: false } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t('pages.data.chart.faultTypeStatistics', 'Fault Type Statistics')}
        style={{ marginTop: 16 }}
      >
        <Line
          height={260}
          data={faultTypeLineData}
          xField="type"
          yField="value"
          seriesField="metric"
          smooth
          point={{ size: 4 }}
          yAxis={{
            title: { text: t('pages.data.axis.totalDurationRatio', 'Total Duration / Ratio (%)') },
          }}
          legend={{ position: 'bottom' }}
        />
      </Card>
    </PageContainer>
  );
};

export default DataPage;
