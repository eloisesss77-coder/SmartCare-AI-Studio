import React from 'react';
import { Card, Tag, Space, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { RadarData } from '@/types';

const { Text, Title } = Typography;

interface RadarStatusCardProps {
  radarData: RadarData;
}

const RadarStatusCard: React.FC<RadarStatusCardProps> = ({ radarData }) => {
  const navigate = useNavigate();
  const isFall = radarData.fallStatus === 1;
  const isInBed = radarData.inBed === 1;
  const heartRateNormal = radarData.heartRate >= 60 && radarData.heartRate <= 100;

  const getHeartRateColor = (value: number): string => {
    if (value < 40 || value > 120) return '#f5222d';
    if (value < 60 || value > 90) return '#fa8c16';
    return '#52c41a';
  };

  const handleClick = () => {
    navigate(`/elderly/${radarData.elderId}`);
  };

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{
        borderRadius: 8,
        cursor: 'pointer',
        borderColor: isFall ? '#f5222d' : '#f0f0f0',
        borderWidth: isFall ? 2 : 1,
        animation: isFall ? 'alert-blink 1s ease-in-out infinite' : 'none',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 头部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              {radarData.elderName}
            </Title>
            {isFall && (
              <Tag color="error" icon={<WarningOutlined />}>
                跌倒
              </Tag>
            )}
          </Space>
          <Text type="secondary">
            <HomeOutlined /> {radarData.roomNo}
          </Text>
        </div>

        {/* 状态信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0',
            background: '#fafafa',
            borderRadius: 6,
          }}
        >
          {/* 在床状态 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>
              {isInBed ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#fa8c16' }} />
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isInBed ? '在床' : '离床'}
            </Text>
          </div>

          {/* 心率 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: getHeartRateColor(radarData.heartRate),
              }}
            >
              {radarData.heartRate}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              BPM
            </Text>
          </div>

          {/* 活动量 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: radarData.activityLevel > 80 ? '#fa8c16' : '#1890ff',
              }}
            >
              {radarData.activityLevel}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              活动量
            </Text>
          </div>
        </div>

        {/* 呼吸率 */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            呼吸率：{radarData.breathRate} 次/分 | 姿态：{radarData.bodyPosture}
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default RadarStatusCard;
