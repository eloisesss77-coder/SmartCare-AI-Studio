import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getElderlyDetail, getElderlyDevices } from '../../services/api';
import type { ElderlyDetail, DeviceItem } from '../../types';
import './elder-detail.scss';

export default function ElderDetail() {
  const router = useRouter();
  const id = Number(router.params.id);
  const [elder, setElder] = useState<ElderlyDetail | null>(null);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eRes, dRes] = await Promise.all([getElderlyDetail(id), getElderlyDevices(id)]);
      setElder(eRes.data || null);
      setDevices(dRes.data || []);
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(fetch, [fetch]);

  if (loading || !elder) {
    return <View className='page'><View className='loading'><Text className='muted'>加载中...</Text></View></View>;
  }

  const statusColor = elder.status === 'danger' ? '#e55353' : elder.status === 'warning' ? '#e08a19' : '#15a66a';

  return (
    <View className='page'>
      <View className='top-bar'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}><Text>‹ 返回</Text></View>
        <Text className='title'>{elder.name}</Text>
        <Text className='sub'>{elder.age}岁 · {elder.gender === 2 ? '女' : '男'} · {elder.roomNo}室</Text>
      </View>

      <ScrollView scrollY className='content'>
        {/* 状态卡 */}
        <View className='card status-card'>
          <Text className='status-title' style={{ color: statusColor }}>
            ● {elder.status === 'normal' ? '当前状态正常' : elder.status === 'warning' ? '需关注' : '紧急告警'}
          </Text>
          <Text className='muted'>最后活动：{elder.lastActivity || '暂无数据'}</Text>
        </View>

        {/* 实时健康 */}
        <Text className='section-title'>实时健康状态</Text>
        <View className='card'>
          <View className='metric-grid'>
            <View className='metric'>
              <Text className='metric-big'>{elder.heartRate ?? '--'}</Text>
              <Text className='metric-label'>当前心率 bpm</Text>
            </View>
            <View className='metric'>
              <Text className='metric-big'>{elder.breathRate ?? '--'}</Text>
              <Text className='metric-label'>呼吸 次/分</Text>
            </View>
            <View className='metric'>
              <Text className='metric-big'>{elder.sleepHours ?? '--'}</Text>
              <Text className='metric-label'>昨夜睡眠(h)</Text>
            </View>
            <View className='metric'>
              <Text className='metric-big'>{elder.toiletCount ?? '--'}</Text>
              <Text className='metric-label'>今日如厕</Text>
            </View>
          </View>
        </View>

        {/* 居家感知 */}
        <Text className='section-title'>居家感知</Text>
        <View className='card'>
          {devices.length === 0 && <Text className='muted'>暂无绑定设备</Text>}
          {devices.map((d) => (
            <View key={d.id} className='device-row'>
              <View className='device-icon'>📡</View>
              <View className='device-info'>
                <Text className='device-name'>{d.deviceName}</Text>
                <Text className='muted'>
                  <Text className={`online-dot ${d.onlineStatus ? 'on' : 'off'}`}></Text>
                  {d.onlineStatus ? '在线' : '离线'} · 最近心跳 {d.lastHeartbeat || '无'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 快捷入口 */}
        <Text className='section-title'>快捷操作</Text>
        <View className='card quick-grid'>
          <View className='quick-item' onClick={() => Taro.navigateTo({ url: `/pages/reports/reports?elderId=${id}` })}>
            <Text className='quick-icon'>📊</Text><Text>健康报告</Text>
          </View>
          <View className='quick-item' onClick={() => Taro.switchTab({ url: '/pages/alerts/alerts' })}>
            <Text className='quick-icon'>🔔</Text><Text>告警记录</Text>
          </View>
          <View className='quick-item' onClick={() => Taro.navigateTo({ url: `/pages/devices/devices?elderId=${id}` })}>
            <Text className='quick-icon'>📡</Text><Text>设备管理</Text>
          </View>
        </View>

        <View style={{ height: '40px' }} />
      </ScrollView>
    </View>
  );
}
