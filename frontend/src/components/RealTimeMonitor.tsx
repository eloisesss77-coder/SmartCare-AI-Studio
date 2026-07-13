import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface RealTimeMonitorProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  normalMin: number;
  normalMax: number;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({
  title,
  value,
  unit,
  min,
  max,
  normalMin,
  normalMax,
}) => {
  const getColor = (val: number): string => {
    if (val < normalMin || val > normalMax) return '#f5222d';
    if (val < normalMin * 1.1 || val > normalMax * 0.9) return '#fa8c16';
    return '#52c41a';
  };

  const option: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        center: ['50%', '55%'],
        radius: '85%',
        min,
        max,
        axisLine: {
          show: true,
          lineStyle: {
            width: 18,
            color: [
              [0.3, '#52c41a'],
              [0.7, '#fa8c16'],
              [1, '#f5222d'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '70%',
          width: 8,
          offsetCenter: [0, '-10%'],
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          length: 8,
          lineStyle: {
            color: 'auto',
            width: 2,
          },
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 3,
          },
        },
        axisLabel: {
          color: '#464646',
          fontSize: 12,
          distance: 20,
          formatter: (val: number) => `${val}`,
        },
        title: {
          offsetCenter: [0, '75%'],
          fontSize: 14,
          color: '#666',
        },
        detail: {
          valueAnimation: true,
          fontSize: 28,
          fontWeight: 'bold',
          offsetCenter: [0, '42%'],
          formatter: '{value}',
          color: getColor(value),
        },
        data: [
          {
            value,
            name: `${title} (${unit})`,
          },
        ],
      },
    ],
  };

  return (
    <div style={{ width: '100%', maxWidth: 280 }}>
      <ReactECharts option={option} style={{ height: 220 }} />
    </div>
  );
};

export default RealTimeMonitor;
