import type { PropsWithChildren } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import { familyLogin } from './services/api';
import './app.scss';

export default function App({ children }: PropsWithChildren) {
  useLaunch(async () => {
    // 登录
    await doLogin();
  });
  return <>{children}</>;
}

async function doLogin() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const loginRes = await Taro.login();
      if (!loginRes.code) throw new Error(`wx.login fail: ${loginRes.errMsg}`);

      const res = await familyLogin(loginRes.code);
      if (res.data?.familyId) {
        Taro.setStorageSync('familyId', res.data.familyId);
        Taro.setStorageSync('nickname', res.data.nickname || '');
        Taro.setStorageSync('familyName', res.data.familyName || '');
        console.log('[login] success familyId:', res.data.familyId);
        return;
      }
    } catch (e) {
      console.error(`[login] attempt ${attempt} fail:`, (e as Error)?.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  Taro.showModal({
    title: '登录失败',
    content: '请检查网络后重试',
    confirmText: '重试',
    cancelText: '稍后',
    success: (r) => r.confirm && doLogin(),
  });
}
