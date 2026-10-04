import { useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './privacy.scss';

const PRIVACY_VERSION = '1.0';
const PRIVACY_AGREED_KEY = 'privacyAgreed';

const SECTIONS = [
  { title: '一、我们收集哪些信息', items: [
    '您的微信昵称、头像（来自微信授权）',
    '您设备的序列号、位置、在线状态',
    '雷达监测的心率、呼吸、跌倒、活动状态数据',
    '摄像头视频（如需录像功能）',
  ]},
  { title: '二、信息用于什么目的', items: [
    '为老人提供健康监测与异常告警',
    '向您推送告警通知、健康日报/周报',
    '改进产品与服务质量',
  ]},
  { title: '三、隐私保护措施', items: [
    '毫米波雷达无摄像头、不采集任何视频/图像',
    '所有数据加密传输（HTTPS）',
    '数据仅用于监测与告警，不对外出售',
  ]},
  { title: '四、您的权利', items: [
    '可随时在「我的→通知设置」关闭推送',
    '可联系客服删除您的全部数据',
    '可随时解除与老人的绑定',
  ]},
  { title: '五、第三方服务', items: [
    '微信订阅消息推送（仅推送告警与日报）',
    '不与任何其他第三方共享个人数据',
  ]},
];

export default function Privacy() {
  useEffect(() => {
    // 如果已经同意过，不要停留在隐私页
    const agreed = Taro.getStorageSync(PRIVACY_AGREED_KEY);
    if (agreed === PRIVACY_VERSION) {
      Taro.switchTab({ url: '/pages/index/index' });
    }
  }, []);

  const agree = () => {
    Taro.setStorageSync(PRIVACY_AGREED_KEY, PRIVACY_VERSION);
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const disagree = () => {
    Taro.showModal({
      title: '温馨提示',
      content: '不同意将无法使用安伴智慧科技守护的核心功能，确定不同意吗？',
      confirmText: '我要使用',
      cancelText: '确定不同意',
      success: (r) => {
        if (r.confirm) agree();
      },
    });
  };

  return (
    <View className='page privacy-page'>
      <View className='privacy-top'>
        <Text className='privacy-logo'>🛡️</Text>
        <Text className='privacy-title'>隐私与数据授权</Text>
        <Text className='privacy-sub'>安伴智慧科技守护 · 让爱，不缺席</Text>
      </View>

      <ScrollView scrollY className='privacy-content'>
        {SECTIONS.map((s) => (
          <View key={s.title} className='section'>
            <Text className='section-title'>{s.title}</Text>
            {s.items.map((t, i) => (
              <Text key={i} className='section-item'>• {t}</Text>
            ))}
          </View>
        ))}
      </ScrollView>

      <View className='privacy-footer'>
        <View className='btn-disagree' onClick={disagree}>不同意</View>
        <View className='btn-agree' onClick={agree}>同意并继续</View>
      </View>
    </View>
  );
}
