import type { PropsWithChildren } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import { setLoginReady } from './services/api';
import './app.scss';

/** 全局登录 Promise — api.ts 可等待它完成后再发需要 familyId 的请求 */
let loginResolve: (() => void) | null = null;
export const loginReady = new Promise<void>((resolve) => { loginResolve = resolve; });

// ---------- 测试用固定 openid ----------
// 上线前改为 false，正式版使用 wx.login 获取真实 openid
const USE_FIXED_OPENID = true;
const FIXED_OPENID = 'test_openid_001';

/** 生成简单 UUID（小程序环境不用 crypto.randomUUID） */
function generateUUID(): string {
  const s = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return s() + s() + '-' + s() + '-' + s() + '-' + s() + '-' + s() + s() + s();
}

function App({ children }: PropsWithChildren) {
  useLaunch(async () => {
    console.log('安伴 Guardian 小程序启动');
    await doLogin();
    // 登录完成后通知 api.ts 可以安全发请求了
    if (loginResolve) {
      setLoginReady();
      loginResolve();
      loginResolve = null;
    }
  });

  // 不阻塞页面渲染，登录在后台进行
  return <>{children}</>;
}

async function doLogin() {
  try {
    let deviceId: string;
    if (USE_FIXED_OPENID) {
      // 测试模式：固定 openid，清缓存/换设备也不会丢失绑定数据
      deviceId = FIXED_OPENID;
    } else {
      deviceId = Taro.getStorageSync('deviceId');
      if (!deviceId) {
        deviceId = generateUUID();
        Taro.setStorageSync('deviceId', deviceId);
      }
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
