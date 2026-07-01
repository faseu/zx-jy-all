import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Card, Divider, Form, Select, Space, Table } from 'antd';
import React from 'react';

type LogRecord = {
  id: string;
  username: string;
  loginTime: string;
  action: string;
  operationTime: string;
};

const LogPage: React.FC = () => {
  const intl = useIntl();
  const t = (id: string, defaultMessage: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id, defaultMessage }, values);
  const allOption = t('pages.log.option.all', 'All');
  const logData: LogRecord[] = [
    {
      id: 'log-1',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickProvince', 'Clicked Riyadh province'),
      operationTime: '2025-12-12 12:00:00',
    },
    {
      id: 'log-2',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickPrison', 'Clicked AAAA prison'),
      operationTime: '2025-12-12 12:01:00',
    },
    {
      id: 'log-3',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickFloor', 'Clicked floor {floor}', { floor: 6 }),
      operationTime: '2025-12-12 12:01:10',
    },
    {
      id: 'log-4',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickDevice', 'Clicked device'),
      operationTime: '2025-12-12 12:02:00',
    },
    {
      id: 'log-5',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickProvinceBranch', 'Clicked Riyadh province branch'),
      operationTime: '2025-12-12 12:02:30',
    },
    {
      id: 'log-6',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickPrisonBranch', 'Clicked AAAA prison branch'),
      operationTime: '2025-12-12 12:03:00',
    },
    {
      id: 'log-7',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickBlockAll', 'Clicked block all devices'),
      operationTime: '2025-12-12 12:03:49',
    },
    {
      id: 'log-8',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.clickConfirm', 'Clicked confirm'),
      operationTime: '2025-12-12 12:04:00',
    },
    {
      id: 'log-9',
      username: 'Ahmed',
      loginTime: '2025-12-12 12:00:00',
      action: t('pages.log.demo.logout', 'Logged out'),
      operationTime: '2025-12-12 12:05:00',
    },
    {
      id: 'log-10',
      username: 'CHOKJ',
      loginTime: '2025-12-11 12:00:00',
      action: t('pages.log.demo.clickProvince', 'Clicked Riyadh province'),
      operationTime: '2025-12-11 12:00:00',
    },
  ];

  return (
    <PageContainer title={false}>
      <Card title={t('pages.log.query.title', 'Query Table')} size="small">
        <Form layout="inline">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Form.Item label={t('pages.log.field.province', 'Province')} name="province">
              <Select
                style={{ width: 180 }}
                placeholder={allOption}
                options={[
                  { label: allOption, value: 'all' },
                  { label: 'Riyadh', value: 'riyadh' },
                  { label: 'Jeddah', value: 'jeddah' },
                ]}
              />
            </Form.Item>
            <Form.Item label={t('pages.log.field.prisonLevel', 'Prison Level')} name="level">
              <Select
                style={{ width: 180 }}
                placeholder={allOption}
                options={[
                  { label: allOption, value: 'all' },
                  { label: 'AAA', value: 'aaa' },
                  { label: 'AA', value: 'aa' },
                  { label: 'A', value: 'a' },
                ]}
              />
            </Form.Item>
            <div style={{ marginLeft: 'auto' }}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />}>
                  {t('pages.log.action.search', 'Search')}
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      </Card>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<DownloadOutlined />}>{t('pages.log.action.export', 'Export')}</Button>
      </div>

      <Card>
        <Table<LogRecord>
          rowKey="id"
          dataSource={logData}
          pagination={{ pageSize: 10, total: 658, showSizeChanger: false }}
          columns={[
            {
              title: t('pages.log.column.username', 'Username'),
              dataIndex: 'username',
            },
            {
              title: t('pages.log.column.loginTime', 'Login Time'),
              dataIndex: 'loginTime',
            },
            {
              title: t('pages.log.column.action', 'Action'),
              dataIndex: 'action',
            },
            {
              title: t('pages.log.column.operationTime', 'Operation Time'),
              dataIndex: 'operationTime',
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default LogPage;
