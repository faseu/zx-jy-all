import { Pie } from '@ant-design/plots';
import { useIntl } from '@umijs/max';
import { Card, Segmented, Typography } from 'antd';
import numeral from 'numeral';
import React from 'react';
import type { DataItem } from '../data.d';
import useStyles from '../style.style';

const { Text } = Typography;
const ProportionSales = ({
  dropdownGroup,
  salesType,
  loading,
  salesPieData,
  handleChangeSalesType,
}: {
  loading: boolean;
  dropdownGroup: React.ReactNode;
  salesType: 'all' | 'online' | 'stores';
  salesPieData: DataItem[];
  handleChangeSalesType?: (value: 'all' | 'online' | 'stores') => void;
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const t = (id: string, defaultMessage: string) => intl.formatMessage({ id, defaultMessage });
  return (
    <Card
      loading={loading}
      className={styles.salesCard}
      variant="borderless"
      title={t('pages.dashboard.analysis.salesCategoryRatio', 'Sales Category Ratio')}
      style={{
        height: '100%',
      }}
      extra={
        <div className={styles.salesCardExtra}>
          {dropdownGroup}
          <Segmented
            className={styles.salesTypeRadio}
            value={salesType}
            onChange={handleChangeSalesType}
            options={[
              { label: t('pages.dashboard.analysis.allChannels', 'All Channels'), value: 'all' },
              { label: t('pages.dashboard.analysis.online', 'Online'), value: 'online' },
              { label: t('pages.dashboard.analysis.stores', 'Stores'), value: 'stores' },
            ]}
            size="middle"
          />
        </div>
      }
    >
      <Text>{t('pages.dashboard.analysis.sales', 'Sales')}</Text>
      <Pie
        height={340}
        radius={0.8}
        innerRadius={0.5}
        angleField="y"
        colorField="x"
        data={salesPieData as any}
        legend={false}
        label={{
          position: 'spider',
          text: (item: { x: number; y: number }) => `${item.x}: ${numeral(item.y).format('0,0')}`,
        }}
      />
    </Card>
  );
};
export default ProportionSales;
