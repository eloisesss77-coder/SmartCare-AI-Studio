import { View, Text } from '@tarojs/components';
import { RadarData } from '../../types';
import { postureLabel } from '../../utils/format';
import './vital-panel.scss';

interface Props {
  data: RadarData | null;
  loading: boolean;
}

/** 活动量映射 */
const activityMap: Record<string, number> = {
  stationary: 5, resting: 15, low: 30, moderate: 55, active: 75, high: 90, walking: 85,
};

export default function VitalPanel({ data, loading }: Props) {
  if (!data) {
    return (
      <View className="vp-empty">
        <Text className="text-muted">{loading ? '加载中...' : '暂无雷达数据'}</Text>
      </View>
    );
  }

  const hr = data.heartRate;
  const br = data.breathRate;
  const activity = activityMap[data.activityLevel] ?? 0;

  const hrColor = hr < 40 || hr > 120 ? '#f5222d' : (hr < 60 || hr > 90) ? '#fa8c16' : '#52c41a';
  const brColor = br < 8 || br > 30 ? '#f5222d' : (br < 12 || br > 24) ? '#fa8c16' : '#52c41a';

  return (
    <View className="vp-panel">
      {/* 双仪表盘 */}
      <View className="vp-gauges">
        <View className="vp-gauge">
          <View className="vp-gauge-circle" style={{ borderColor: hrColor }}>
            <Text className="vp-gauge-value" style={{ color: hrColor }}>{hr}</Text>
            <Text className="vp-gauge-unit">BPM</Text>
          </View>
          <Text className="vp-gauge-label">心率</Text>
        </View>
        <View className="vp-gauge">
          <View className="vp-gauge-circle" style={{ borderColor: brColor }}>
            <Text className="vp-gauge-value" style={{ color: brColor }}>{br}</Text>
            <Text className="vp-gauge-unit">次/分</Text>
          </View>
          <Text className="vp-gauge-label">呼吸</Text>
        </View>
      </View>

      {/* 状态标签 */}
      <View className="vp-tags">
        <View className="vp-tag-item">
          <Text className="vp-tag-label">活动量</Text>
          <View className="vp-progress-bar">
            <View className="vp-progress-fill" style={{ width: `${activity}%`, backgroundColor: activity > 80 ? '#fa8c16' : '#1890ff' }} />
          </View>
        </View>
        <View className="vp-tag-row">
          <Text className="vp-tag-label">跌倒</Text>
          <Text className={data.fallStatus === 1 ? 'tag tag-red' : 'tag tag-green'}>
            {data.fallStatus === 1 ? '⚠ 跌倒!' : '✓ 安全'}
          </Text>
        </View>
        <View className="vp-tag-row">
          <Text className="vp-tag-label">在床</Text>
          <Text className={data.inBed === 1 ? 'tag tag-blue' : 'tag tag-orange'}>
            {data.inBed === 1 ? '在床' : '离床'}
          </Text>
          <Text className="tag tag-default ml-8">
            {postureLabel(data.bodyPosture)}
          </Text>
        </View>
      </View>
    </View>
  );
}
