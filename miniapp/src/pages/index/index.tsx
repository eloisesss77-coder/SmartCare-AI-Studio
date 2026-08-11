import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro';
import { getMyElderly } from '../../services/api';
import ElderlyCard from '../../components/elderly-card/elderly-card';
import AlertBanner from '../../components/alert-banner/alert-banner';
import type { MyElderlyItem } from '../../types';
import './index.scss';

export default function Index() {
  const [list, setList] = useState<MyElderlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: string; message: string; elderlyId: number }>({ type: '', message: '', elderlyId: 0 });
  const listRef = useRef<MyElderlyItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await getMyElderly();
      const data = res.data || [];
      setList(data);
      listRef.current = data;
      setError(false);

      // 检查是否有跌倒告警
      const fallItem = data.find((item) => item.latestRadarData?.fallStatus === 1);
      if (fallItem) {
        setAlertInfo({
          type: 'fall',
          message: `${fallItem.elderlyName}（${fallItem.roomNo}室）检测到跌倒！`,
          elderlyId: fallItem.elderlyId,
        });
        setShowAlert(true);
      }
    } catch {
      // 已绑定过数据时保留旧列表，不清空
      if (listRef.current.length === 0) {
        setError(true);
      }
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useDidShow(() => {
    fetchData();
  });

  usePullDownRefresh(() => {
    fetchData().then(() => Taro.stopPullDownRefresh());
  });

  const handleCardTap = (id: number) => {
    Taro.navigateTo({ url: `/pages/elderly-detail/elderly-detail?id=${id}` });
  };

  const handleAdd = () => {
    Taro.navigateTo({ url: '/pages/bind/bind' });
  };

  const handleCall = () => {
    Taro.makePhoneCall({ phoneNumber: '120' });
  };

  const handleViewAlert = () => {
    setShowAlert(false);
    Taro.navigateTo({ url: `/pages/elderly-detail/elderly-detail?id=${alertInfo.elderlyId}` });
  };

  if (loading) {
    return (
      <View className="container">
        <View style={{ textAlign: 'center', paddingTop: '200px' }}>
          <Text className="text-muted">加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="container">
      {/* 告警横幅 */}
      <AlertBanner
        visible={showAlert}
        alertType={alertInfo.type}
        message={alertInfo.message}
        onCall={handleCall}
        onView={handleViewAlert}
      />

      {/* 空状态 */}
      {error && list.length === 0 ? (
        <View className="empty-page">
          <Text className="empty-icon">📡</Text>
          <Text className="empty-title">网络连接失败</Text>
          <Text className="empty-desc">请检查网络后重试</Text>
          <View className="btn btn-primary btn-block" onClick={fetchData}>
            重新加载
          </View>
        </View>
      ) : list.length === 0 ? (
        <View className="empty-page">
          <Text className="empty-icon">🏠</Text>
          <Text className="empty-title">还没有绑定老人</Text>
          <Text className="empty-desc">绑定后即可随时查看爸妈的健康状态</Text>
          <View className="btn btn-primary btn-block" onClick={handleAdd}>
            立即绑定
          </View>
        </View>
      ) : (
        <ScrollView scrollY className="elderly-list">
          {list.map((item) => (
            <ElderlyCard
              key={item.elderlyId}
              item={item}
              onTap={() => handleCardTap(item.elderlyId)}
            />
          ))}
          <View className="add-hint" onClick={handleAdd}>
            <Text className="text-muted">+ 添加老人</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
