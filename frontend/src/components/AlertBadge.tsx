import React from 'react';
import { Badge } from 'antd';
import { BellOutlined } from '@ant-design/icons';

interface AlertBadgeProps {
  count: number;
  size?: 'small' | 'default';
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ count, size = 'default' }) => {
  if (count === 0) {
    return (
      <span style={{ color: '#8c8c8c', fontSize: size === 'small' ? 12 : 14 }}>
        <BellOutlined /> 暂无告警
      </span>
    );
  }

  return (
    <span
      className="badge-pulse"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        animationDuration: '2s',
      }}
    >
      <Badge count={count} overflowCount={99}>
        <BellOutlined
          style={{
            fontSize: size === 'small' ? 16 : 20,
            color: '#f5222d',
          }}
        />
      </Badge>
    </span>
  );
};

export default AlertBadge;
