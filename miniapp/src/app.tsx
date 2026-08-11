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
    void doLogin();
  });

  return children;
}

async function doLogin() {
  try {
    let deviceId = Taro.getStorageSync('deviceId');
    if (!deviceId) {
      deviceId = generateUUID();
      Taro.setStorageSync('deviceId', deviceId);
    }

    const res = await Taro.request({
      url: 'https://anban.org.cn/api/v1/family/register',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        openid: deviceId,
        nickname: Taro.getStorageSync('nickname') || '',
        phone: '',
      },
    });

    const ret = res.data as any;
    if (ret?.data?.familyId) {
      Taro.setStorageSync('familyId', ret.data.familyId);
      Taro.setStorageSync('nickname', ret.data.nickname || '');
      Taro.setStorageSync('phone', ret.data.phone || '');
      console.log('登录成功, familyId:', ret.data.familyId);
    }
  } catch (e) {
    console.error('登录请求失败:', e);
  }
}

export default App;
