import { Area } from '@ant-design/plots';
import { useIntl } from '@umijs/max';
import { Statistic } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import useStyles from './index.style';

function fixedZero(val: number) {
  return val * 1 < 10 ? `0${val}` : val;
}
function getActiveData() {
  const activeData = [];
  for (let i = 0; i < 24; i += 1) {
    activeData.push({
      x: `${fixedZero(i)}:00`,
      y: Math.floor(Math.random() * 200) + i * 50,
    });
  }
  return activeData;
}

const ActiveChart = () => {
  const intl = useIntl();
  const timerRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  const { styles } = useStyles();
  const [activeData, setActiveData] = useState<{ x: string; y: number }[]>([]);
  const unit = intl.formatMessage({
    id: 'pages.dashboard.monitor.billionYuan',
    defaultMessage: 'billion yuan',
  });
  const loopData = useCallback(() => {
    requestRef.current = requestAnimationFrame(() => {
      timerRef.current = window.setTimeout(() => {
        setActiveData(getActiveData());
        loopData();
      }, 2000);
    });
  }, []);

  useEffect(() => {
    loopData();
    return () => {
      clearTimeout(timerRef.current as number);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [loopData]);

  return (
    <div className={styles.activeChart}>
      <Statistic
        title={intl.formatMessage({
          id: 'pages.dashboard.monitor.targetEvaluation',
          defaultMessage: 'Target Evaluation',
        })}
        value={intl.formatMessage({
          id: 'pages.dashboard.monitor.expectedTarget',
          defaultMessage: 'Expected to meet target',
        })}
      />
      <div
        style={{
          marginTop: 32,
        }}
      >
        <Area
          padding={[0, 0, 0, 0]}
          xField="x"
          axis={false}
          yField="y"
          height={84}
          style={{
            fill: 'linear-gradient(-90deg, white 0%, #6294FA 100%)',
            fillOpacity: 0.6,
          }}
          data={activeData}
        />
      </div>
      {activeData && (
        <div>
          <div className={styles.activeChartGrid}>
            <p>
              {[...activeData].sort()[activeData.length - 1]?.y + 200} {unit}
            </p>
            <p>
              {[...activeData].sort()[Math.floor(activeData.length / 2)]?.y} {unit}
            </p>
          </div>
          <div className={styles.dashedLine}>
            <div className={styles.line} />
          </div>
          <div className={styles.dashedLine}>
            <div className={styles.line} />
          </div>
        </div>
      )}
      {activeData && (
        <div className={styles.activeChartLegend}>
          <span>00:00</span>
          <span>{activeData[Math.floor(activeData.length / 2)]?.x}</span>
          <span>{activeData[activeData.length - 1]?.x}</span>
        </div>
      )}
    </div>
  );
};

export default ActiveChart;
