import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getAlertDetail, handleAlert } from '../../services/api';
import type { AlertItem } from '../../types';
import {
  alertTypeLabel, alertLevelColor, alertLevelLabel, handleStatusLabel, formatRelativeTime,
} from '../../utils/format';
import './alert-detail.scss';

export default function AlertDetail() {
  const router = useRouter();
  const id = Number(router.params.id);
  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAlertDetail(id)
      .then((res) => setAlert(res.data))
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async () => {
    if (!alert) return;
    try {
      await handleAlert(alert.id, '已阅');
      Taro.showToast({ title: '已标记为已阅', icon: 'success' });
      setAlert({ ...alert, handledStatus: 2 });
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleCall = () => {
    Taro.makePhoneCall({ phoneNumber: '120' });
  };

  if (loading || !alert) {
    return (
      <View style={{ textAlign: 'center', paddingTop: '200px' }}>
        <Text className="text-muted">加载中...</Text>
      </View>
    );
  }

  return (
    <View className="alert-detail-page">
      <View className="card">
        <View className="flex-between mb-16">
          <View className="flex-row">
            <View className="level-icon" style={{ backgroundColor: alertLevelColor(alert.alertLevel) }} />
            <Text className="ad-type">{alertTypeLabel(alert.alertType)}</Text>
          </View>
          <Text className="tag tag-red" style={{ backgroundColor: alertLevelColor(alert.alertLevel) + '20', color: alertLevelColor(alert.alertLevel), border: 'none' }}>
            {alertLevelLabel(alert.alertLevel)}
          </Text>
        </View>

        <View className="ad-info">
          <View className="ad-info-row">
            <Text className="ad-label">老人</Text>
            <Text className="ad-value">{alert.elderlyName}</Text>
          </View>
          <View className="ad-info-row">
            <Text className="ad-label">房间</Text>
            <Text className="ad-value">{alert.roomNo}室</Text>
          </View>
          <View className="ad-info-row">
            <Text className="ad-label">时间</Text>
            <Text className="ad-value">{alert.createdAt}</Text>
          </View>
          {alert.triggerValue && (
            <View className="ad-info-row">
              <Text className="ad-label">触发值</Text>
              <Text className="ad-value">{alert.triggerValue}</Text>
            </View>
          )}
          <View className="ad-info-row">
            <Text className="ad-label">处理状态</Text>
            <Text className={`ad-value ${alert.handledStatus === 0 ? 'text-danger' : 'text-success'}`}>
              {handleStatusLabel(alert.handledStatus)}
            </Text>
          </View>
        </View>

        <View className="ad-message-box">
          <Text className="ad-message">{alert.alertMessage}</Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="ad-actions">
        {alert.handledStatus === 0 && (
          <View className="btn btn-primary btn-block" onClick={handleConfirm}>
            已阅
          </View>
        )}
        <View className="btn btn-danger btn-block mt-16" onClick={handleCall}>
          📞 紧急呼叫
        </View>
      </View>
    </View>
  );
}
