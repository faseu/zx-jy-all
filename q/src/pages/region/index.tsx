import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useRequest } from '@umijs/max';
import { Table, message } from 'antd';
import React from 'react';
import SaudiMap from '@/components/SaudiMap';
import type { ProvinceVO } from './data.d';
import { queryProvinceList } from './service';
import './index.less';

const RegionPage: React.FC = () => {
  const intl = useIntl();
  const { data, loading } = useRequest(queryProvinceList);
  const provinceList = data ?? [];

  const handleProvinceClick = (provinceName: string) => {
    if (provinceList.length === 0) {
      message.warning(intl.formatMessage({ id: 'pages.region.message.provinceLoading' }));
      return;
    }

    const matched = provinceList.find((item: ProvinceVO) => item.provinceName === provinceName);
    if (matched?.provinceId === undefined || matched?.provinceId === null) {
      message.warning(
        intl.formatMessage({ id: 'pages.region.message.provinceNotFound' }, { name: provinceName })
      );
      return;
    }

    history.push(`/region/province/${matched.provinceId}`);
  };

  return (
    <PageContainer title={false}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }} className="region-table-wrap">
          <Table<ProvinceVO>
            className="region-table"
            rowKey={(record) => record.provinceId ?? record.provinceName ?? ''}
            loading={loading}
            size="small"
            dataSource={provinceList}
            columns={[
              {
                title: intl.formatMessage({ id: 'pages.region.field.province' }),
                dataIndex: 'provinceName',
                align: 'center',
              },
              {
                title: intl.formatMessage({ id: 'pages.region.field.totalPrisons' }),
                dataIndex: 'totalPrisons',
                align: 'center',
              },
              {
                title: intl.formatMessage({ id: 'pages.region.field.totalDevices' }),
                dataIndex: 'totalDevices',
                align: 'center',
              },
            ]}
            pagination={false}
            onRow={(record) => ({
              onClick: () => {
                if (record.provinceId !== undefined && record.provinceId !== null) {
                  history.push(`/region/province/${record.provinceId}`);
                }
              },
              style: {
                cursor:
                  record.provinceId !== undefined && record.provinceId !== null
                    ? 'pointer'
                    : 'default',
              },
            })}
          />
        </div>
        <div style={{ width: '60%', maxWidth: '60%', minWidth: 240 }}>
          <SaudiMap height={700} onProvinceClick={handleProvinceClick} />
        </div>
      </div>
    </PageContainer>
  );
};

export default RegionPage;
