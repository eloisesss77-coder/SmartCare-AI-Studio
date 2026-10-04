import { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBindCode } from '../../services/api';
import './bind.scss';

export default function Bind() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBind = async () => {
    if (!code.trim() || code.trim().length < 4) {
      Taro.showToast({ title: '请输入有效的绑定码', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const res = await useBindCode(code.trim().toUpperCase());
      Taro.showToast({ title: `已绑定 ${res.data?.elderlyName || ''}`, icon: 'success' });
      setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 1500);
    } catch (e: any) {
      Taro.showToast({ title: e.message || '绑定码无效', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='page bind-page'>
      <View className='top-bar'>
        <Text className='title'>绑定老人</Text>
      </View>

      <View className='content-center'>
        <Text className='bind-icon'>🔑</Text>
        <Text className='bind-title'>输入绑定码</Text>
        <Text className='bind-desc'>请联系设备安装人员或护理端获取绑定码</Text>

        <Input
          className='bind-input'
          placeholder='6 位绑定码'
          maxlength={6}
          value={code}
          onInput={(e) => setCode(e.detail.value.toUpperCase())}
        />

        <View className={`btn-primary btn-block ${loading ? 'disabled' : ''}`} onClick={!loading ? handleBind : undefined}>
          {loading ? '绑定中...' : '立即绑定'}
        </View>

        <Text className='bind-link' onClick={() => Taro.navigateTo({ url: '/pages/devices/devices' })}>
          已有设备 SN · 去手动绑定 ›
        </Text>
      </View>
    </View>
  );
}
