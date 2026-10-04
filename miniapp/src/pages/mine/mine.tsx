import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getNotifications, updateNotifications } from '../../services/api';
import type { NotificationSettings } from '../../types';
import './mine.scss';

const SWITCHES: { key: keyof NotificationSettings; label: string; desc: string }[] = [
  { key: 'wechat_enabled', label: '微信通知', desc: '接收推送消息总开关' },
  { key: 'alert_fall', label: '跌倒告警', desc: '紧急情况立即推送' },
  { key: 'alert_abnormal', label: '异常活动告警', desc: '长时间静止等异常' },
  { key: 'daily_report', label: '健康日报', desc: '每日早8点推送' },
  { key: 'weekly_report', label: '健康周报', desc: '每周一推送' },
];

export default function Mine() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [nickname, setNickname] = useState('');
  const [familyName, setFamilyName] = useState('');

  useEffect(() => {
    setNickname(Taro.getStorageSync('nickname') || '家属用户');
    setFamilyName(Taro.getStorageSync('familyName') || '');
    getNotifications().then((r) => setSettings(r.data || null)).catch(() => {});
  }, []);

  const toggle = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const newVal = !settings[key];
    const newSettings = { ...settings, [key]: newVal };
    setSettings(newSettings);
    try {
      await updateNotifications({ [key]: newVal });
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' });
      setSettings(settings); // 回滚
    }
  };

  return (
    <View className='page'>
      <View className='top-bar'>
        <Text className='title'>我的</Text>
        <Text className='sub'>账户与守护设置</Text>
      </View>

      <ScrollView scrollY className='content'>
        {/* 头像 */}
        <View className='card mine-header'>
          <View className='avatar mine-avatar'>👩</View>
          <View>
            <Text className='member-name'>{nickname}</Text>
            <Text className='muted'>{familyName || '家庭成员'}</Text>
          </View>
        </View>

        {/* 通知开关 */}
        <Text className='section-title'>通知设置</Text>
        <View className='card'>
          {settings && SWITCHES.map((s, i) => (
            <View key={s.key} className={`switch-row ${i > 0 ? 'border-top' : ''}`}>
              <View>
                <Text className='switch-label'>{s.label}</Text>
                <Text className='switch-desc'>{s.desc}</Text>
              </View>
              <View className={`switch ${settings[s.key] ? 'on' : ''}`} onClick={() => toggle(s.key)}>
                <View className='switch-dot' />
              </View>
            </View>
          ))}
          {!settings && <Text className='muted'>加载中...</Text>}
        </View>

        {/* 菜单 */}
        <Text className='section-title'>其他</Text>
        <View className='card'>
          <View className='menu-row' onClick={() => Taro.navigateTo({ url: '/pages/privacy/privacy' })}>
            <Text className='menu-label'>隐私与数据授权</Text><Text className='arrow'>›</Text>
          </View>
          <View className='menu-row border-top' onClick={() => Taro.showModal({ title: '关于', content: '安伴智慧科技守护 v1.0.0\n让爱，不缺席。', showCancel: false })}>
            <Text className='menu-label'>关于安伴智慧科技守护</Text><Text className='arrow'>›</Text>
          </View>
          <View className='menu-row border-top' onClick={() => {
            Taro.showModal({
              title: '退出登录',
              content: '清除本地数据后需重新微信授权',
              success: (r) => {
                if (r.confirm) {
                  Taro.clearStorageSync();
                  Taro.reLaunch({ url: '/pages/privacy/privacy' });
                }
              },
            });
          }}>
            <Text className='menu-label danger'>退出登录</Text>
          </View>
        </View>

        <View style={{ height: '40px' }} />
      </ScrollView>
    </View>
  );
}
