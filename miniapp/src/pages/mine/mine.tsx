import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './mine.scss';

export default function Mine() {
  const nickname = Taro.getStorageSync('nickname') || '家属用户';
  const phone = Taro.getStorageSync('phone') || '';

  const menuItems = [
    {
      label: '绑定管理',
      desc: '添加或解除老人绑定',
      onClick: () => Taro.navigateTo({ url: '/pages/bind/bind' }),
    },
    {
      label: '通知设置',
      desc: '管理告警推送偏好',
      onClick: () => Taro.showToast({ title: '功能开发中', icon: 'none' }),
    },
    {
      label: '关于我们',
      desc: 'SmartCare 智慧养老 v1.0.0',
      onClick: () => Taro.showModal({
        title: 'SmartCare 守护家人',
        content: '智慧养老全屋监护方案\n8合1设备 · 24小时守护\n联系我们：400-xxx-xxxx',
        showCancel: false,
      }),
    },
  ];

  const handleClearCache = () => {
    Taro.showModal({
      title: '清除缓存',
      content: '将清除所有本地数据，确定继续？',
      success: (res) => {
        if (res.confirm) {
          Taro.clearStorageSync();
          Taro.showToast({ title: '已清除', icon: 'success' });
        }
      },
    });
  };

  return (
    <View className="mine-page">
      {/* 头像区域 */}
      <View className="mine-header">
        <View className="mine-avatar">
          <Text className="avatar-text">{nickname.charAt(0)}</Text>
        </View>
        <Text className="mine-name">{nickname}</Text>
        {phone && <Text className="text-muted">{phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>}
      </View>

      {/* 菜单 */}
      <View className="card">
        {menuItems.map((item) => (
          <View key={item.label} className="mine-menu-item" onClick={item.onClick}>
            <View>
              <Text className="mine-menu-label">{item.label}</Text>
              <Text className="text-muted">{item.desc}</Text>
            </View>
            <Text className="mine-arrow">{'>'}</Text>
          </View>
        ))}
      </View>

      <View className="card mt-16" onClick={handleClearCache}>
        <View className="mine-menu-item">
          <Text className="text-danger">清除缓存</Text>
          <Text className="mine-arrow">{'>'}</Text>
        </View>
      </View>
    </View>
  );
}
