import { Column } from '@ant-design/plots';
import { useIntl } from '@umijs/max';
import { Button, Card, Col, DatePicker, Row, Tabs } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import numeral from 'numeral';
import type { DataItem } from '../data.d';
import useStyles from '../style.style';

export type TimeType = 'today' | 'week' | 'month' | 'year';
const { RangePicker } = DatePicker;

const rankingListData: {
  index: number;
  total: number;
}[] = [];

for (let i = 0; i < 7; i += 1) {
  rankingListData.push({
    index: i,
    total: 323234,
  });
}

const SalesCard = ({
  rangePickerValue,
  salesData,
  isActive,
  handleRangePickerChange,
  loading,
  selectDate,
}: {
  rangePickerValue: RangePickerProps['value'];
  isActive: (key: TimeType) => string;
  salesData: DataItem[];
  loading: boolean;
  handleRangePickerChange: RangePickerProps['onChange'];
  selectDate: (key: TimeType) => void;
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const t = (id: string, defaultMessage: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id, defaultMessage }, values);
  const getStoreTitle = (index: number) =>
    t('pages.dashboard.analysis.storeTitle', 'Store {index}', { index });

  return (
    <Card
      loading={loading}
      variant="borderless"
      styles={{
        body: {
          padding: loading ? 24 : 0,
        },
      }}
    >
      <Tabs
        className={styles.salesCard}
        tabBarExtraContent={
          <div className={styles.salesExtraWrap}>
            <div className={styles.salesExtra}>
              <Button type="text" className={isActive('today')} onClick={() => selectDate('today')}>
                {t('pages.dashboard.analysis.today', 'Today')}
              </Button>
              <Button type="text" className={isActive('week')} onClick={() => selectDate('week')}>
                {t('pages.dashboard.analysis.thisWeek', 'This Week')}
              </Button>
              <Button type="text" className={isActive('month')} onClick={() => selectDate('month')}>
                {t('pages.dashboard.analysis.thisMonth', 'This Month')}
              </Button>
              <Button type="text" className={isActive('year')} onClick={() => selectDate('year')}>
                {t('pages.dashboard.analysis.thisYear', 'This Year')}
              </Button>
            </div>
            <RangePicker
              value={rangePickerValue}
              onChange={handleRangePickerChange}
              variant="filled"
              style={{
                width: 256,
              }}
            />
          </div>
        }
        size="large"
        tabBarStyle={{
          marginBottom: 24,
        }}
        items={[
          {
            key: 'sales',
            label: t('pages.dashboard.analysis.sales', 'Sales'),
            children: (
              <Row>
                <Col xl={16} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesBar}>
                    <Column
                      height={300}
                      data={salesData}
                      xField="x"
                      yField="y"
                      paddingBottom={12}
                      axis={{
                        x: {
                          title: false,
                        },
                        y: {
                          title: false,
                          gridLineDash: null,
                          gridStroke: '#ccc',
                        },
                      }}
                      scale={{
                        x: { paddingInner: 0.4 },
                      }}
                      tooltip={{
                        name: t('pages.dashboard.analysis.salesVolume', 'Sales Volume'),
                        channel: 'y',
                      }}
                    />
                  </div>
                </Col>
                <Col xl={8} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesRank}>
                    <h4 className={styles.rankingTitle}>
                      {t('pages.dashboard.analysis.storeSalesRanking', 'Store Sales Ranking')}
                    </h4>
                    <ul className={styles.rankingList}>
                      {rankingListData.map((item, i) => {
                        const title = getStoreTitle(item.index);
                        return (
                          <li key={title}>
                            <span
                              className={`${styles.rankingItemNumber} ${
                                i < 3 ? styles.rankingItemNumberActive : ''
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className={styles.rankingItemTitle} title={title}>
                              {title}
                            </span>
                            <span>{numeral(item.total).format('0,0')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Col>
              </Row>
            ),
          },
          {
            key: 'views',
            label: t('pages.dashboard.analysis.visits', 'Visits'),
            children: (
              <Row>
                <Col xl={16} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesBar}>
                    <Column
                      height={300}
                      data={salesData}
                      xField="x"
                      yField="y"
                      paddingBottom={12}
                      axis={{
                        x: {
                          title: false,
                        },
                        y: {
                          title: false,
                        },
                      }}
                      scale={{
                        x: { paddingInner: 0.4 },
                      }}
                      tooltip={{
                        name: t('pages.dashboard.analysis.visits', 'Visits'),
                        channel: 'y',
                      }}
                    />
                  </div>
                </Col>
                <Col xl={8} lg={12} md={12} sm={24} xs={24}>
                  <div className={styles.salesRank}>
                    <h4 className={styles.rankingTitle}>
                      {t('pages.dashboard.analysis.storeVisitsRanking', 'Store Visits Ranking')}
                    </h4>
                    <ul className={styles.rankingList}>
                      {rankingListData.map((item, i) => {
                        const title = getStoreTitle(item.index);
                        return (
                          <li key={title}>
                            <span
                              className={`${
                                i < 3 ? styles.rankingItemNumberActive : styles.rankingItemNumber
                              }`}
                            >
                              {i + 1}
                            </span>
                            <span className={styles.rankingItemTitle} title={title}>
                              {title}
                            </span>
                            <span>{numeral(item.total).format('0,0')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </Card>
  );
};
export default SalesCard;
