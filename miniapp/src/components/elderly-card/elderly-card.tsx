import { View, Text } from '@tarojs/components';
import { MyElderlyItem } from '../../types';
import { formatRelativeTime, postureLabel, deviceCategoryLabel } from '../../utils/format';
import './elderly-card.scss';

interface Props {
  item: MyElderlyItem;
  onTap: () => void;
}

export default function ElderlyCard({ item, onTap }: Props) {
  const { elderlyName, roomNo, relation, latestRadarData, unreadAlerts, devices, status } = item;

  const hasFall = latestRadarData?.fallStatus === 1;
  const isOffline = !latestRadarData;
  const hasWarning = unreadAlerts > 0 && !hasFall;

  let dotClass = 'status-dot status-dot-green';
  if (hasFall) dotClass = 'status-dot status-dot-red';
  else if (isOffline) dotClass = 'status-dot status-dot-gray';
  else if (hasWarning) dotClass = 'status-dot status-dot-yellow';

  const hr = latestRadarData?.heartRate;
  const br = latestRadarData?.breathRate;
  const inBed = latestRadarData?.inBed;
  const posture = latestRadarData?.bodyPosture ? postureLabel(latestRadarData.bodyPosture) : '';
  const time = latestRadarData?.timestamp ? formatRelativeTime(latestRadarData.timestamp) : '暂无数据';

  const onlineDevices = devices.filter((d) => d.onlineStatus === 1).length;

  return (
    <View className="elderly-card" onClick={onTap}>
      {/* 跌倒覆盖层 */}
      {hasFall && (
        <View className="fall-overlay">
          <Text className="fall-icon">🆘</Text>
          <Text className="fall-text">跌倒告警！</Text>
        </View>
      )}

      <View className="ec-header">
        <View className="flex-row">
          <View className={dotClass} />
          <Text className="ec-name">{elderlyName}</Text>
        </View>
        <Text className="ec-room">{roomNo}室</Text>
      </View>

      <View className="ec-body">
        <View className="ec-vital">
          <View className="ec-vital-item">
            <Text className="ec-vital-label">心率</Text>
            <Text className={`ec-vital-value ${hr && (hr < 40 || hr > 120) ? 'text-danger' : hr && (hr < 60 || hr > 90) ? 'text-warning' : ''}`}>
              {hr ?? '--'}
            </Text>
            <Text className="ec-vital-unit">BPM</Text>
          </View>
          <View className="ec-divider" />
          <View className="ec-vital-item">
            <Text className="ec-vital-label">呼吸</Text>
            <Text className={`ec-vital-value ${br && (br < 8 || br > 30) ? 'text-danger' : ''}`}>
              {br ?? '--'}
            </Text>
            <Text className="ec-vital-unit">次/分</Text>
          </View>
          <View className="ec-divider" />
          <View className="ec-vital-item">
            <Text className="ec-vital-label">状态</Text>
            <Text className="ec-vital-value ec-posture">
              {inBed === 1 ? '在床' : inBed === 0 ? '离床' : '--'}
            </Text>
            {posture && <Text className="ec-vital-unit">{posture}</Text>}
          </View>
        </View>
      </View>

      <View className="ec-footer">
        <Text className="text-muted">{relation} · {time}</Text>
        <View className="flex-row">
          <Text className="ec-device-count">{onlineDevices}/{devices.length}设备在线</Text>
          {unreadAlerts > 0 && (
            <Text className="ec-badge">{unreadAlerts > 99 ? '99+' : unreadAlerts}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
