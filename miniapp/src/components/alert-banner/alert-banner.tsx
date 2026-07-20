import { View, Text } from '@tarojs/components';
import './alert-banner.scss';

interface Props {
  visible: boolean;
  alertType: string;
  message: string;
  onCall: () => void;
  onView: () => void;
}

export default function AlertBanner({ visible, alertType, message, onCall, onView }: Props) {
  if (!visible) return null;

  const typeLabels: Record<string, string> = {
    fall: '跌倒告警',
    manual_sos: '紧急求救',
    gas_leak: '煤气泄漏',
    smoke_alarm: '火警',
  };

  return (
    <View className="ab-overlay">
      <View className="ab-modal">
        <Text className="ab-icon">🆘</Text>
        <Text className="ab-title">{typeLabels[alertType] || '紧急告警'}</Text>
        <Text className="ab-message">{message}</Text>
        <View className="ab-actions">
          <View className="ab-btn ab-btn-call" onClick={onCall}>
            <Text>📞 立即呼叫</Text>
          </View>
          <View className="ab-btn ab-btn-view" onClick={onView}>
            <Text>查看详情</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
