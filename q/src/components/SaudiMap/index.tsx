import * as echarts from 'echarts';
import React, { useEffect, useRef } from 'react';
import saudiMap from '@/assets/map/SA_regions.json';

interface SaudiMapProps {
  height?: number;
  onProvinceClick?: (provinceName: string) => void;
}

const SaudiMap: React.FC<SaudiMapProps> = ({ height = 700, onProvinceClick }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const onProvinceClickRef = useRef<SaudiMapProps['onProvinceClick']>(onProvinceClick);

  useEffect(() => {
    onProvinceClickRef.current = onProvinceClick;
  }, [onProvinceClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    echarts.registerMap('saudi', saudiMap as any);

    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => params?.name ?? '',
      },
      geo: {
        map: 'saudi',
        roam: true,
        zoom: 1.1,
        scaleLimit: { min: 1, max: 6 },
        label: {
          show: true,
          color: '#997652',
          formatter: (params: any) => params?.name ?? '',
        },
        itemStyle: {
          areaColor: '#bacda9',
          borderColor: '#ffffff',
        },
        emphasis: {
          itemStyle: { areaColor: '#a7bac6' },
        },
        regions: [
          { name: 'Qassim', itemStyle: { areaColor: '#bacda9' } },
          { name: 'Riyadh', itemStyle: { areaColor: '#e5d9c3' } },
          { name: 'Tabuk', itemStyle: { areaColor: '#c9e0cc' } },
          { name: 'Madinah', itemStyle: { areaColor: '#f4ddb4' } },
          { name: 'Makkah', itemStyle: { areaColor: '#bacda9' } },
          { name: 'Northern Region', itemStyle: { areaColor: '#e5d9c3' } },
          { name: 'Jawf', itemStyle: { areaColor: '#c9e0cc' } },
          { name: 'Hail', itemStyle: { areaColor: '#f4ddb4' } },
          { name: 'Bahah', itemStyle: { areaColor: '#bacda9' } },
          { name: 'Jizan', itemStyle: { areaColor: '#e5d9c3' } },
          { name: 'Asir', itemStyle: { areaColor: '#c9e0cc' } },
          { name: 'Najran', itemStyle: { areaColor: '#f4ddb4' } },
          { name: 'Eastern Region', itemStyle: { areaColor: '#bacda9' } },
        ],
      },
      series: [],
    };

    chart.setOption(option, true);

    const handleClick = (params: any) => {
      const provinceName = params?.name;
      if (typeof provinceName === 'string' && onProvinceClickRef.current) {
        onProvinceClickRef.current(provinceName);
      }
    };
    chart.on('click', handleClick);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.off('click', handleClick);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
};

export default SaudiMap;
