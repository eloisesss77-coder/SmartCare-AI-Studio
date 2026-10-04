import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getMyElderly, getFamilyMe } from '../../services/api';
import type { ElderlyItem, FamilyMe } from '../../types';
import './index.scss';

export default function Index() {
  const [list, setList] = useState<ElderlyItem[]>([]);
  const [family, setFamily] = useState<FamilyMe | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // 隐私检查
    if (Taro.getStorageSync('privacyAgreed') !== '1.0') {
      Taro.reLaunch({ url: '/pages/privacy/privacy' });
      return;
    }
    try {
      const [elderRes, famRes] = await Promise.all([getMyElderly(), getFamilyMe()]);
      setList(elderRes.data || []);
      setFamily(famRes.data || null);
    } catch (e) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(fetchData);

  const handleElderTap = (id: number) => {
    Taro.navigateTo({ url: `/pages/elder-detail/elder-detail?id=${id}` });
  };

  const handleAlertTap = () => {
    Taro.switchTab({ url: '/pages/alerts/alerts' });
  };

  // 今日提醒取最近的 2 条告警
  const todayTips = list.slice(0, 2);

  return (
    <View className='page'>
      {/* 顶部栏 */}
      <View className='top-bar'>
        <Text className='title'>安伴智慧科技守护</Text>
        <Text className='sub'>今天是 {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</Text>
      </View>

      {loading && <View className='loading'><Text className='muted'>加载中...</Text></View>}

      {!loading && (
        <ScrollView scrollY className='content'>
          {/* 家庭整体状态 Hero */}
          {family && (
            <View className='hero'>
              <Text className='hero-small'>家庭整体守护状态</Text>
              <Text className='hero-big'>
                {family.pendingAlerts > 0 ? '需关注 · 有紧急提醒' : '安心 · 运行正常'}
              </Text>
              <Text className='hero-small'>
                {family.elderlyCount}位老人 · {family.deviceCount}台设备 · {family.unreadAlerts}个待处理提醒
              </Text>
            </View>
          )}

          {/* 我的老人 */}
          <View className='section-header'>
            <Text className='section-title'>我的老人</Text>
            <View className='add-btn' onClick={() => Taro.navigateTo({ url: '/pages/bind/bind' })}>
              <Text className='add-icon'>+</Text>
              <Text>添加</Text>
            </View>
          </View>

          {list.length === 0 && (
            <View className='empty'>
              <Text className='empty-icon'>🏠</Text>
              <Text className='empty-title'>还没有绑定老人</Text>
              <Text className='empty-desc'>请先在管理端生成绑定码，或手动绑定设备</Text>
              <View className='btn-primary btn-block' onClick={() => Taro.navigateTo({ url: '/pages/bind/bind' })}>
                立即绑定
              </View>
            </View>
          )}

          {list.map((item) => (
            <View key={item.elderlyId} className='card elder-card' onClick={() => handleElderTap(item.elderlyId)}>
              <View className='elder-header'>
                <View className='avatar'>👴</View>
                <View className='elder-info'>
                  <Text className='elder-name'>{item.elderlyName}</Text>
                  <Text className='muted'>
                    {item.relation || ''} · {item.age}岁 · {item.familyName || ''}
                  </Text>
                </View>
                <Text className={`tag ${item.statusLevel === 'warning' || item.statusLevel === 'danger' ? 'tag-red' : 'tag-green'}`}>
                  {item.statusTag} ›
                </Text>
              </View>

              {item.statusLevel !== 'normal' && (
                <View className='alert-warn'>
                  ⚠️ {item.lastActivity || '请确认老人状态'}
                </View>
              )}

              {item.latestRadarData && (
                <View className='metric-grid'>
                  <View className='metric'>
                    <Text className='metric-big'>{item.latestRadarData.heartRate ?? '--'}</Text>
                    <Text className='metric-label'>心率 bpm</Text>
                  </View>
                  <View className='metric'>
                    <Text className='metric-big'>{item.latestRadarData.breathRate ?? '--'}</Text>
                    <Text className='metric-label'>呼吸</Text>
                  </View>
                  <View className='metric'>
                    <Text className='metric-big'>
                      {item.latestRadarData.inBed ? '在床' : '离床'}
                    </Text>
                    <Text className='metric-label'>当前状态</Text>
                  </View>
                  <View className='metric'>
                    <Text className='metric-big'>
                      {item.latestRadarData.activityLevel === 'stationary' ? '静止' :
                        item.latestRadarData.activityLevel === 'vigorous' ? '活跃' :
                        item.latestRadarData.activityLevel ? '活动中' : '--'}
                    </Text>
                    <Text className='metric-label'>室内活动</Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* 今日提醒 */}
          <Text className='section-title'>今日提醒</Text>
          <View className='tip-item'>
            {family && family.pendingAlerts > 0 && (
              <View className='tip alert'>
                <View className='tip-row'>
                  <Text className='tip-title'>活动异常</Text>
                  <Text className='tip-time'>{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text className='tip-desc'>
                  {list.find((l) => l.statusLevel !== 'normal')?.elderlyName || '有老人'} · 检测到异常活动
                </Text>
                <View className='tip-btn' onClick={handleAlertTap}>查看详情 ›</View>
              </View>
            )}
            {family && family.unreadAlerts === 0 && (
              <View className='tip ok'>
                <View className='tip-row'>
                  <Text className='tip-title'>✓ 今日运行正常</Text>
                </View>
                <Text className='tip-desc'>所有设备在线，暂无异常告警</Text>
              </View>
            )}
          </View>

          <View style={{ height: '40px' }} />
        </ScrollView>
      )}
    </View>
  );
}
