import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Descriptions,
  Spin,
  Typography,
  Select,
  Empty,
  Tag,
  Progress,
  Tabs,
  Table,
} from 'antd';
import {
  ManOutlined,
  WomanOutlined,
  QuestionOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CalendarOutlined,
  HeartOutlined,
  FallOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { getElderlyDetail, getElderlyRadarData, getRadarDataHistory, getDailyReports } from '@/services/api';
import config from '@/config';
import type { Elderly, RadarData, DailyReportItem } from '@/types';

const { Title, Text } = Typography;

const timeRangeOptions = [
  { label: '最近1小时', value: 1 },
  { label: '最近6小时', value: 6 },
  { label: '最近24小时', value: 24 },
];

const ElderlyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [elderly, setElderly] = useState<Elderly | null>(null);
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [historyData, setHistoryData] = useState<RadarData[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReportItem[]>([]);
  const [reportDays, setReportDays] = useState(7);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [timeRange, setTimeRange] = useState(1);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [elderlyRes, radarRes] = await Promise.all([
        getElderlyDetail(Number(id)),
        getElderlyRadarData(Number(id)),
      ]);
      setElderly(elderlyRes.data);
      setRadarData(radarRes.data);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    const end = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const start = dayjs().subtract(timeRange, 'hour').format('YYYY-MM-DD HH:mm:ss');
    try {
      const res = await getRadarDataHistory({
        elderId: Number(id),
        start,
        end,
      });
      setHistoryData(res.data?.list ?? []);
    } catch {
      // 错误已处理
    }
  }, [id, timeRange]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, config.REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const fetchDailyReports = useCallback(async () => {
    if (!id) return;
    setReportLoading(true);
    try {
      const res = await getDailyReports(Number(id), reportDays);
      setDailyReports(res.data?.reports ?? []);
    } catch {
      // 错误已处理
    } finally {
      setReportLoading(false);
    }
  }, [id, reportDays]);

  useEffect(() => {
    fetchDailyReports();
  }, [fetchDailyReports]);

  const bodyPostureLabels: Record<string, string> = {
    standing: '站立',
    sitting: '坐姿',
    lying: '平躺',
    walking: '行走',
    unknown: '未知',
  };

  const activityLevelMap: Record<string, number> = {
    stationary: 5,
    resting: 15,
    low: 30,
    moderate: 55,
    active: 75,
    high: 90,
    walking: 85,
  };

  const getHeartRateColor = (val: number): string => {
    if (val < 40 || val > 120) return '#f5222d';
    if (val < 60 || val > 90) return '#fa8c16';
    return '#52c41a';
  };

  const getBreathRateColor = (val: number): string => {
    if (val < 8 || val > 30) return '#f5222d';
    if (val < 12 || val > 24) return '#fa8c16';
    return '#52c41a';
  };

  // 心率仪表盘配置
  const heartGaugeOption: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        center: ['50%', '55%'],
        radius: '80%',
        min: 0,
        max: 150,
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.27, '#52c41a'],
              [0.4, '#fa8c16'],
              [0.6, '#52c41a'],
              [0.8, '#fa8c16'],
              [1, '#f5222d'],
            ],
          },
        },
        pointer: {
          length: '70%',
          width: 6,
          itemStyle: { color: 'auto' },
        },
        axisTick: { distance: -16, length: 8, lineStyle: { width: 2, color: '#999' } },
        splitLine: { distance: -20, length: 16, lineStyle: { width: 3, color: '#999' } },
        axisLabel: { color: '#999', fontSize: 10, distance: 25 },
        title: { offsetCenter: [0, '80%'], fontSize: 12, color: '#666' },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '45%'],
          formatter: '{value} BPM',
          color: getHeartRateColor(radarData?.heartRate ?? 0),
        },
        data: [{ value: radarData?.heartRate ?? 0, name: '心率' }],
      },
    ],
  };

  // 呼吸率仪表盘配置
  const breathGaugeOption: EChartsOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        center: ['50%', '55%'],
        radius: '80%',
        min: 0,
        max: 40,
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.3, '#52c41a'],
              [0.6, '#fa8c16'],
              [0.75, '#52c41a'],
              [1, '#f5222d'],
            ],
          },
        },
        pointer: {
          length: '70%',
          width: 6,
          itemStyle: { color: 'auto' },
        },
        axisTick: { distance: -16, length: 8, lineStyle: { width: 2, color: '#999' } },
        splitLine: { distance: -20, length: 16, lineStyle: { width: 3, color: '#999' } },
        axisLabel: { color: '#999', fontSize: 10, distance: 25 },
        title: { offsetCenter: [0, '80%'], fontSize: 12, color: '#666' },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '45%'],
          formatter: '{value} 次/分',
          color: getBreathRateColor(radarData?.breathRate ?? 0),
        },
        data: [{ value: radarData?.breathRate ?? 0, name: '呼吸率' }],
      },
    ],
  };

  // 历史趋势图配置
  const historyOption: EChartsOption = {
    title: {
      text: '历史数据趋势',
      left: 'center',
      textStyle: { fontSize: 14, color: '#666' },
    },
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      data: ['心率', '呼吸率', '活动量'],
      textStyle: { fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: historyData.map((d) => dayjs(d.timestamp).format('HH:mm')),
      boundaryGap: false,
      axisLabel: { fontSize: 11, color: '#999' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'BPM / 次/分',
        axisLabel: { fontSize: 11, color: '#999' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      {
        type: 'value',
        name: '活动量',
        max: 100,
        axisLabel: { fontSize: 11, color: '#999' },
      },
    ],
    series: [
      {
        name: '心率',
        type: 'line',
        smooth: true,
        data: historyData.map((d) => d.heartRate),
        itemStyle: { color: '#f5222d' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 3,
      },
      {
        name: '呼吸率',
        type: 'line',
        smooth: true,
        data: historyData.map((d) => d.breathRate),
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 3,
      },
      {
        name: '活动量',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: historyData.map((d) => activityLevelMap[d.activityLevel] ?? 0),
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 2, type: 'dashed' },
        symbol: 'circle',
        symbolSize: 3,
      },
    ],
    grid: {
      top: 50,
      right: 50,
      bottom: 40,
      left: 50,
    },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 200 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (notFound) {
    return <Empty description={`老人 ID ${id} 不存在或无权访问`} />;
  }

  if (!elderly) {
    return <Empty description="未找到该老人信息" />;
  }

  return (
    <div className="page-container">
      <Title level={4} className="page-title" style={{ marginBottom: 16 }}>
        {elderly.name} - 详情监控
      </Title>

      <Row gutter={[16, 16]} align="stretch">
        {/* 左侧：基本信息卡片 */}
        <Col xs={24} lg={8}>
          <Card
            title="基本信息"
            style={{ borderRadius: 8, height: '100%' }}
            styles={{ body: { height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' } }}
          >
            <Descriptions column={1} size="middle" bordered style={{ flex: 1 }}>
              <Descriptions.Item label="姓名">
                <Text strong>{elderly.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="年龄">{elderly.age} 岁</Descriptions.Item>
              <Descriptions.Item label="性别">
                {elderly.gender === 1 ? (
                  <><ManOutlined style={{ color: '#1890ff' }} /> 男</>
                ) : elderly.gender === 2 ? (
                  <><WomanOutlined style={{ color: '#eb2f96' }} /> 女</>
                ) : (
                  <><QuestionOutlined /> 未知</>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="房间号">
                <Tag icon={<EnvironmentOutlined />} color="blue">
                  {elderly.roomNo}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="病史">
                {elderly.medicalHistory || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="紧急联系人">
                {elderly.emergencyContact || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="紧急电话">
                {elderly.emergencyPhone ? (
                  <Text copyable>
                    <PhoneOutlined /> {elderly.emergencyPhone}
                  </Text>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="绑定雷达">
                {elderly.radarDeviceSn ? (
                  <Tag color="blue">{elderly.radarDeviceSn}</Tag>
                ) : (
                  <Tag color="default">未绑定</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                <CalendarOutlined /> {elderly.createdAt}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 右侧：Tab切换面板 */}
        <Col xs={24} lg={16}>
          <Tabs
            defaultActiveKey="realtime"
            items={[
              {
                key: 'realtime',
                label: '实时监控',
                children: (
                  <>
                    {/* 实时数据面板 */}
                    <Card
                      title="实时监控数据"
                      style={{ borderRadius: 8, marginBottom: 16 }}
                      extra={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          自动刷新中...
                        </Text>
                      }
                    >
                      {radarData ? (
                        <>
                          <Row gutter={[16, 16]} justify="center">
                            <Col xs={24} sm={12} md={8}>
                              <div style={{ textAlign: 'center' }}>
                                <ReactECharts option={heartGaugeOption} style={{ height: 200 }} />
                              </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                              <div style={{ textAlign: 'center' }}>
                                <ReactECharts option={breathGaugeOption} style={{ height: 200 }} />
                              </div>
                            </Col>
                            <Col xs={24} md={8}>
                              <Card size="small" style={{ textAlign: 'center', height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ marginBottom: 16 }}>
                                  <Text type="secondary">活动量</Text>
                                  <Progress
                                    type="circle"
                                    percent={activityLevelMap[radarData.activityLevel] ?? 0}
                                    size={80}
                                    strokeColor={
                                      (activityLevelMap[radarData.activityLevel] ?? 0) > 80 ? '#fa8c16' : '#1890ff'
                                    }
                                  />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <Text type="secondary">跌倒状态：</Text>
                                  {radarData.fallStatus === 1 ? (
                                    <Tag color="error" style={{ fontSize: 14, padding: '2px 12px' }}>
                                      跌倒警告!
                                    </Tag>
                                  ) : (
                                    <Tag color="success" style={{ fontSize: 14, padding: '2px 12px' }}>
                                      正常
                                    </Tag>
                                  )}
                                </div>
                                <div>
                                  <Text type="secondary">在床状态：</Text>
                                  <Tag color={radarData.inBed === 1 ? 'green' : 'orange'}>
                                    {radarData.inBed === 1 ? '在床' : '离床'}
                                  </Tag>
                                  <Tag>{bodyPostureLabels[radarData.bodyPosture] || radarData.bodyPosture}</Tag>
                                </div>
                              </Card>
                            </Col>
                          </Row>
                        </>
                      ) : (
                        <Empty description="暂无雷达数据" />
                      )}
                    </Card>

                    {/* 历史趋势图 */}
                    <Card
                      title="历史数据趋势"
                      style={{ borderRadius: 8 }}
                      extra={
                        <Select
                          value={timeRange}
                          onChange={setTimeRange}
                          options={timeRangeOptions}
                          size="small"
                          style={{ width: 130 }}
                        />
                      }
                    >
                      {historyData.length > 0 ? (
                        <ReactECharts option={historyOption} style={{ height: 300 }} />
                      ) : (
                        <Empty description="暂无历史数据" />
                      )}
                    </Card>
                  </>
                ),
              },
              {
                key: 'daily',
                label: '健康日报',
                children: (
                  <Card
                    title="健康日报"
                    style={{ borderRadius: 8 }}
                    extra={
                      <Select
                        value={reportDays}
                        onChange={setReportDays}
                        options={[
                          { label: '最近7天', value: 7 },
                          { label: '最近15天', value: 15 },
                          { label: '最近30天', value: 30 },
                        ]}
                        size="small"
                        style={{ width: 120 }}
                      />
                    }
                  >
                    <Table
                      dataSource={dailyReports}
                      rowKey="date"
                      loading={reportLoading}
                      pagination={false}
                      size="small"
                      locale={{ emptyText: <Empty description="暂无日报数据" /> }}
                      columns={[
                        {
                          title: '日期',
                          dataIndex: 'date',
                          key: 'date',
                          width: 110,
                          render: (d: string) => <Text strong>{d}</Text>,
                        },
                        {
                          title: '心率',
                          key: 'heartRate',
                          render: (_: unknown, r: DailyReportItem) => {
                            if (r.heartRateAvg === null) return <Tag color="default">无数据</Tag>;
                            const color = r.heartRateStatus === 'danger' ? 'red' : r.heartRateStatus === 'warning' ? 'orange' : 'green';
                            return (
                              <span>
                                <HeartOutlined style={{ color: color === 'red' ? '#f5222d' : color === 'orange' ? '#fa8c16' : '#52c41a', marginRight: 4 }} />
                                <Tag color={color}>
                                  均{r.heartRateAvg}bpm ({r.heartRateMin}-{r.heartRateMax})
                                </Tag>
                              </span>
                            );
                          },
                        },
                        {
                          title: '呼吸',
                          key: 'breathRate',
                          render: (_: unknown, r: DailyReportItem) => {
                            if (r.breathRateAvg === null) return <Tag color="default">无数据</Tag>;
                            const color = r.breathRateStatus === 'danger' ? 'red' : r.breathRateStatus === 'warning' ? 'orange' : 'blue';
                            return (
                              <Tag color={color}>
                                均{r.breathRateAvg}次/分 ({r.breathRateMin}-{r.breathRateMax})
                              </Tag>
                            );
                          },
                        },
                        {
                          title: '跌倒',
                          key: 'fall',
                          width: 80,
                          render: (_: unknown, r: DailyReportItem) =>
                            r.fallCount > 0 ? (
                              <Tag color="red" icon={<FallOutlined />}>{r.fallCount}次</Tag>
                            ) : (
                              <Tag color="success">0次</Tag>
                            ),
                        },
                        {
                          title: '告警',
                          key: 'alerts',
                          width: 80,
                          render: (_: unknown, r: DailyReportItem) =>
                            r.alertCount > 0 ? (
                              <Tag color="orange" icon={<AlertOutlined />}>{r.alertCount}条</Tag>
                            ) : (
                              <Tag color="success">无</Tag>
                            ),
                        },
                        {
                          title: '数据量',
                          dataIndex: 'dataCount',
                          key: 'dataCount',
                          width: 80,
                          render: (c: number) => <Text type="secondary">{c}条</Text>,
                        },
                      ]}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ElderlyDetail;
