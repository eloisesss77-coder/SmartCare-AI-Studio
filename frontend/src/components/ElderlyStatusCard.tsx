import React from 'react';
import { Card, Tag, Typography, Progress } from 'antd';
import {
  WarningOutlined,
  HeartOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import type { RadarData } from '@/types';

const { Text, Title } = Typography;

interface ElderlyStatusCardProps {
  radarData: RadarData;
  onClick?: () => void;
}

const bodyPostureLabels: Record<string, string> = {
  standing: '站立',
  sitting: '坐着',
  lying: '躺着',
  walking: '行走中',
};

const ElderlyStatusCard: React.FC<ElderlyStatusCardProps> = ({ radarData, onClick }) => {
  const isFall = radarData.fallStatus === 1;
  const isInBed = radarData.inBed === 1;

  const getHeartRateColor = (value: number): string => {
    if (value < 40 || value > 120) return '#f5222d';
    if (value < 60 || value > 90) return '#fa8c16';
    return '#52c41a';
  };

  const getBreathRateColor = (value: number): string => {
    if (value < 8 || value > 30) return '#f5222d';
    if (value < 12 || value > 24) return '#fa8c16';
    return '#52c41a';
  };

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        borderRadius: 8,
        borderColor: isFall ? '#f5222d' : '#f0f0f0',
        borderWidth: isFall ? 2 : 1,
      }}
      className={isFall ? 'alert-blink' : ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>
          {radarData.elderName}
        </Title>
        <Tag color={isFall ? 'error' : 'success'}>{isFall ? '跌倒!' : '安全'}</Tag>
      </div>

      <Text type="secondary">
        <HomeOutlined /> {radarData.roomNo}
      </Text>

      <div style={{ marginTop: 12 }}>
        {/* 心率 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <HeartOutlined style={{ color: getHeartRateColor(radarData.heartRate) }} />
          <Text strong style={{ color: getHeartRateColor(radarData.heartRate), fontSize: 20 }}>
            {radarData.heartRate}
          </Text>
          <Text type="secondary">BPM</Text>
        </div>

        {/* 呼吸率 */}
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            呼吸率：
          </Text>
          <Text strong style={{ color: getBreathRateColor(radarData.breathRate), fontSize: 16 }}>
            {radarData.breathRate}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            次/分
          </Text>
        </div>

        {/* 活动量进度条 */}
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            活动量
          </Text>
          <Progress
            percent={radarData.activityLevel}
            size="small"
            strokeColor={
              radarData.activityLevel > 80 ? '#fa8c16' : '#1890ff'
            }
          />
        </div>

        {/* 在床状态 */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Tag color={isInBed ? 'green' : 'orange'}>
            {isInBed ? '在床' : '离床'}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {bodyPostureLabels[radarData.bodyPosture] || radarData.bodyPosture}
          </Text>
        </div>

        {/* 跌倒警告 */}
        {isFall && (
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <Tag color="error" icon={<WarningOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
              检测到跌倒事件
            </Tag>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ElderlyStatusCard;
