import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Table, Tag, Spin, Typography, Empty } from 'antd';
import {
  UserOutlined,
  WifiOutlined,
  WarningOutlined,
  FallOutlined,
  HomeOutlined,
  HeartOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ColumnsType } from 'antd/es/table';
import { getDashboardOverview, getAlertTrend, getAlertList } from '@/services/api';
import type { DashboardOverview, AlertTrend, RoomStatus, AlertRecord } from '@/types';

const { Text, Title } = Typography;

const alertLevelColors: Record<string, string> = {
  info: 'blue',
  warning: 'gold',
  critical: 'orange',
  emergency: 'red',
};

const alertLevelLabels: Record<string, string> = {
  info: '提示',
  warning: '一般',
  critical: '重要',
  emergency: '紧急',
};

const alertTypeLabels: Record<string, string> = {
  fall: '跌倒',
  heart_rate: '心率异常',
  breath_rate: '呼吸异常',
  inactivity: '久未活动',
  offline: '设备离线',
};

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [alertTrend, setAlertTrend] = useState<AlertTrend[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, trendRes, alertsRes] = await Promise.all([
        getDashboardOverview(),
        getAlertTrend(7),
        getAlertList({ page: 1, pageSize: 5 }),
      ]);
      setOverview(overviewRes.data);
      setAlertTrend(trendRes.data);
      setRecentAlerts(alertsRes.data?.list ?? []);
    } catch {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // 告警趋势图配置
  const trendOption: EChartsOption = {
    title: {
      text: '近7天告警趋势',
      left: 'center',
      textStyle: { fontSize: 14, color: '#666' },
    },
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      data: ['总告警', '跌倒', '心率异常', '呼吸异常'],
      textStyle: { fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: alertTrend.map((d) => d.date),
      boundaryGap: false,
      axisLabel: { fontSize: 11, color: '#999' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 11, color: '#999' },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        name: '总告警',
        type: 'line',
        smooth: true,
        data: alertTrend.map((d) => d.total),
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '跌倒',
        type: 'line',
        smooth: true,
        data: alertTrend.map((d) => d.fall),
        itemStyle: { color: '#f5222d' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '心率异常',
        type: 'line',
        smooth: true,
        data: alertTrend.map((d) => d.heartRate),
        itemStyle: { color: '#fa8c16' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
      {
        name: '呼吸异常',
        type: 'line',
        smooth: true,
        data: alertTrend.map((d) => d.breathRate),
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
    grid: {
      top: 50,
      right: 20,
      bottom: 40,
      left: 40,
    },
  };

  // 最近告警列
  const alertColumns: ColumnsType<AlertRecord> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
    {
      title: '老人',
      dataIndex: 'elderName',
      key: 'elderName',
      width: 80,
    },
    {
      title: '房间',
      dataIndex: 'roomNo',
      key: 'roomNo',
      width: 70,
    },
    {
      title: '类型',
      dataIndex: 'alertType',
      key: 'alertType',
      width: 90,
      render: (val: string) => alertTypeLabels[val] || val,
    },
    {
      title: '等级',
      dataIndex: 'alertLevel',
      key: 'alertLevel',
      width: 70,
      align: 'center',
      render: (val: string) => (
        <Tag color={alertLevelColors[val] || 'default'}>{alertLevelLabels[val] || val}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'handledStatus',
      key: 'handledStatus',
      width: 80,
      align: 'center',
      render: (val: number) => {
        const map: Record<number, { color: string; text: string }> = {
          0: { color: 'red', text: '未处理' },
          1: { color: 'processing', text: '处理中' },
          2: { color: 'green', text: '已处理' },
        };
        return <Tag color={map[val]?.color}>{map[val]?.text}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 200 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Title level={4} className="page-title" style={{ marginBottom: 16 }}>
        监控大屏
      </Title>

      {/* 顶部统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-card-icon icon-blue">
              <UserOutlined />
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value" style={{ color: '#1890ff' }}>
                {overview?.totalElderly ?? 0}
              </div>
              <div className="stat-card-label">在住老人总数</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-card-icon icon-green">
              <WifiOutlined />
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value" style={{ color: '#52c41a' }}>
                {overview?.onlineDevices ?? 0}
              </div>
              <div className="stat-card-label">在线设备数</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div
            className={`stat-card ${(overview?.activeAlerts ?? 0) > 0 ? 'alert-pulse' : ''}`}
          >
            <div className="stat-card-icon icon-red">
              <WarningOutlined />
            </div>
            <div className="stat-card-content">
              <div
                className={`stat-card-value ${(overview?.activeAlerts ?? 0) > 0 ? 'alert-blink' : ''}`}
                style={{ color: '#f5222d' }}
              >
                {overview?.activeAlerts ?? 0}
              </div>
              <div className="stat-card-label">活跃告警数</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-card-icon icon-orange">
              <FallOutlined />
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value" style={{ color: '#fa8c16' }}>
                {overview?.fallCountToday ?? 0}
              </div>
              <div className="stat-card-label">今日跌倒次数</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 中部：左侧图表 + 右侧房间状态 */}
      <Row gutter={[16, 16]} align="stretch" style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <div className="section-card" style={{ height: '100%' }}>
            <div className="section-title">告警趋势</div>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="section-card" style={{ height: '100%' }}>
            <div className="section-title">
              房间状态
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                共 {overview?.roomStatusList?.length ?? 0} 间
              </Text>
            </div>
            <Row gutter={[10, 10]} style={{ maxHeight: 310, overflowY: 'auto', padding: '4px 0' }}>
              {(overview?.roomStatusList ?? []).length > 0 ? (
                (overview?.roomStatusList ?? []).map((room, idx) => (
                  <Col xs={12} key={`${room.roomNo}-${room.elderName}-${idx}`}>
                    <div
                      style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: 8,
                        padding: '10px 12px',
                        background: room.fallStatus === 1 ? '#fff2f0' : !room.online ? '#fafafa' : '#f6ffed',
                        borderLeft: room.fallStatus === 1 ? '4px solid #f5222d' : !room.online ? '4px solid #d9d9d9' : '4px solid #52c41a',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 14 }}>
                          <HomeOutlined style={{ marginRight: 4 }} />
                          {room.roomNo || '-'}
                        </Text>
                        <Tag color={room.online ? 'green' : 'default'} style={{ margin: 0 }}>
                          {room.online ? <><CheckCircleOutlined /> 在线</> : <><CloseCircleOutlined /> 离线</>}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {room.elderName || '-'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>
                          <Tag color={room.inBed === 1 ? 'green' : 'orange'}>
                            {room.inBed === 1 ? '在床' : '离床'}
                          </Tag>
                        </span>
                        <span style={{ color: '#666' }}>
                          <HeartOutlined style={{ marginRight: 2 }} />
                          {room.heartRate ? `${room.heartRate} bpm` : '-'}
                        </span>
                        <span>
                          {room.fallStatus === 1 ? (
                            <Tag color="error" icon={<AlertOutlined />}>跌倒</Tag>
                          ) : (
                            <Tag color="success">安全</Tag>
                          )}
                        </span>
                      </div>
                    </div>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Empty description="暂无房间数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Col>
              )}
            </Row>
          </div>
        </Col>
      </Row>

      {/* 底部：最近告警列表 */}
      <div className="section-card">
        <div className="section-title">
          最近告警
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            显示最近5条
          </Text>
        </div>
        <Table
          columns={alertColumns}
          dataSource={recentAlerts}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default Dashboard;
