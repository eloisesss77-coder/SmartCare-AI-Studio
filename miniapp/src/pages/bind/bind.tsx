import { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBindCode } from '../../services/api';
import './bind.scss';

export default function Bind() {
  const [code, setCode] = useState('');
  const [relation, setRelation] = useState('子女');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const relations = ['子女', '配偶', '亲属', '其他'];

  // 等待登录完成
  useEffect(() => {
    let retries = 0;
    const check = setInterval(() => {
      const fid = Taro.getStorageSync('familyId');
      if (fid) {
        setIsLoggedIn(true);
        clearInterval(check);
      }
      retries++;
      if (retries > 30) clearInterval(check); // 15秒超时
    }, 500);
    return () => clearInterval(check);
  }, []);

  const handleBind = async () => {
    if (!code || code.length < 4) {
      Taro.showToast({ title: '请输入正确的绑定码', icon: 'none' });
      return;
    }

    const familyId = Taro.getStorageSync('familyId');
    if (!familyId) {
      Taro.showToast({ title: '登录未完成，请稍后重试', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const res = await useBindCode(code, relation);
      Taro.showModal({
        title: '绑定成功',
        content: `已成功绑定 ${res.data?.elderlyName || ''}（${res.data?.roomNo || ''}室）`,
        showCancel: false,
        success: () => Taro.switchTab({ url: '/pages/index/index' }),
      });
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || '绑定失败';
      Taro.showToast({ title: msg, icon: 'none', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    Taro.scanCode({
      success: (res) => {
        if (res.result) {
          // 扫码结果可能是 URL?code=XXXXX 或纯绑定码
          const match = res.result.match(/[A-Z0-9]{4,8}$/i);
          setCode(match ? match[0] : res.result);
        }
      },
      fail: () => Taro.showToast({ title: '扫码失败', icon: 'none' }),
    });
  };

  return (
    <View className="bind-page">
      <View className="card">
        <Text className="bind-title">绑定老人</Text>
        <Text className="bind-desc">输入管理端提供的6位绑定码，或扫描二维码自动绑定</Text>

        {/* 绑定码输入 */}
        <View className="bind-input-group">
          <Text className="bind-label">绑定码</Text>
          <View className="bind-input-row">
            <Input
              className="bind-input"
              type="text"
              maxlength={10}
              value={code}
              onInput={(e) => setCode(e.detail.value)}
              placeholder="请输入绑定码"
            />
            <View className="btn btn-outline" onClick={handleScan}>
              扫码
            </View>
          </View>
        </View>

        {/* 关系选择 */}
        <View className="bind-input-group">
          <Text className="bind-label">我的身份</Text>
          <View className="relation-list">
            {relations.map((r) => (
              <View
                key={r}
                className={`relation-chip ${relation === r ? 'relation-chip-active' : ''}`}
                onClick={() => setRelation(r)}
              >
                <Text>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={`btn btn-primary btn-block mt-24 ${loading ? 'btn-loading' : ''}`} onClick={handleBind}>
          {loading ? '绑定中...' : '确认绑定'}
        </View>
      </View>

      <View className="bind-tips">
        <Text className="text-muted">绑定码请联系养老机构管理员获取</Text>
        <Text className="text-muted mt-8">绑定码有效期为24小时</Text>
      </View>
    </View>
  );
}
