import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HeartRateDataPoint {
  time: string;
  value: number;
}

interface HeartRateChartProps {
  data: HeartRateDataPoint[];
  title?: string;
  height?: number;
}

const HeartRateChart: React.FC<HeartRateChartProps> = ({
  data,
  title = '心率趋势',
  height = 300,
}) => {
  const times = data.map((d) => d.time);
  const values = data.map((d) => d.value);

  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 14, color: '#666' },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = params as { axisValue: string; value: number }[];
        if (!p || p.length === 0) return '';
        return `${p[0].axisValue}<br/>心率：<strong>${p[0].value}</strong> BPM`;
      },
    },
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: {
        fontSize: 11,
        color: '#999',
      },
    },
    yAxis: {
      type: 'value',
      name: 'BPM',
      min: 0,
      max: 150,
      interval: 30,
      axisLabel: {
        fontSize: 11,
        color: '#999',
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    visualMap: {
      show: false,
      pieces: [
        { lt: 40, color: '#f5222d' },
        { gte: 40, lt: 60, color: '#fa8c16' },
        { gte: 60, lt: 100, color: '#52c41a' },
        { gte: 100, lt: 120, color: '#fa8c16' },
        { gte: 120, color: '#f5222d' },
      ],
    },
    series: [
      {
        data: values,
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#1890ff',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
        markArea: {
          silent: true,
          data: [
            [
              { yAxis: 60, itemStyle: { color: 'rgba(82, 196, 26, 0.06)' } },
              { yAxis: 100 },
            ],
          ],
        },
      },
    ],
    grid: {
      top: 50,
      right: 20,
      bottom: 30,
      left: 50,
    },
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};

export default HeartRateChart;
