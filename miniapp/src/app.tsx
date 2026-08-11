import { PropsWithChildren } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import './app.scss';

/** 生成简单 UUID（小程序环境不用 crypto.randomUUID） */
function generateUUID(): string {
  const s = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return s() + s() + '-' + s() + '-' + s() + '-' + s() + '-' + s() + s() + s();
}

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('安伴 Guardian 小程序启动');

    // 获取或生成设备唯一标识（避免 wx.login 每次换 code 导致账号对不上）
    let deviceId = Taro.getStorageSync('deviceId');
    if (!deviceId) {
      deviceId = generateUUID();
      Taro.setStorageSync('deviceId', deviceId);
    }

    // 用稳定 ID 注册/登录后端
    Taro.request({
      url: 'https://anban.org.cn/api/v1/family/register',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        openid: deviceId,
        nickname: Taro.getStorageSync('nickname') || '',
        phone: '',
      },
      success: (res) => {
        const ret = res.data as any;
        if (ret?.data?.familyId) {
          Taro.setStorageSync('familyId', ret.data.familyId);
          Taro.setStorageSync('nickname', ret.data.nickname || '');
          Taro.setStorageSync('phone', ret.data.phone || '');
          console.log('登录成功, familyId:', ret.data.familyId);
        }
      },
      fail: () => console.log('登录请求失败'),
    });
  });

  return children;
}

export default App;
