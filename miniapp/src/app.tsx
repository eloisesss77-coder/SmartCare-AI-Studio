import { PropsWithChildren } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import './app.scss';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('安伴 Guardian 小程序启动');

    // 自动登录：获取 wx.login code → 后端注册/登录 → 存 familyId
    Taro.login({
      success: (loginRes) => {
        if (!loginRes.code) return;
        Taro.request({
          url: 'http://118.178.98.48/api/v1/family/register',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: {
            openid: loginRes.code, // 后端用 code 换取真实 openid
            nickname: '',
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
      },
      fail: () => console.log('wx.login 失败'),
    });
  });

  return children;
}

export default App;
