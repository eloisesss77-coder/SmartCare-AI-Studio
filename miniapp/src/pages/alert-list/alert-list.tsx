import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import { getAlertList } from '../../services/api';
import type { AlertItem } from '../../types';
import {
  formatRelativeTime, alertTypeLabel, alertLevelColor, alertLevelLabel,
} from '../../utils/format';
import './alert-list.scss';

export default function AlertList() {
  const [list, setList] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, number | string> = { page: 1, pageSize: 50 };
      if (levelFilter) params.alertLevel = levelFilter;
      const res = await getAlertList(params);
      setList(res.data?.list || []);
      setTotal(res.data?.total || 0);
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [levelFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  usePullDownRefresh(() => {
    fetchList().then(() => Taro.stopPullDownRefresh());
  });

  const levelOptions = [
    { value: '', label: '全部' },
    { value: 'emergency', label: '紧急' },
    { value: 'critical', label: '重要' },
    { value: 'warning', label: '一般' },
  ];

  return (
    <View className="alert-page">
      {/* 筛选栏 */}
      <View className="filter-bar">
        {levelOptions.map((opt) => (
          <View
            key={opt.value}
            className={`filter-chip ${levelFilter === opt.value ? 'filter-chip-active' : ''}`}
            onClick={() => setLevelFilter(opt.value)}
          >
            <Text>{opt.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={{ textAlign: 'center', paddingTop: '120px' }}>
          <Text className="text-muted">加载中...</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={{ textAlign: 'center', paddingTop: '120px' }}>
          <Text className="text-muted">暂无告警</Text>
        </View>
      ) : (
        <ScrollView scrollY className="alert-list">
          {list.map((item) => (
            <View
              key={item.id}
              className="alert-item"
              onClick={() =>
                Taro.navigateTo({ url: `/pages/alert-detail/alert-detail?id=${item.id}` })
              }
            >
              <View className="flex-between">
                <View className="flex-row">
                  <View
                    className="alert-dot"
                    style={{ backgroundColor: alertLevelColor(item.alertLevel) }}
                  />
                  <View>
                    <Text className="alert-type">{alertTypeLabel(item.alertType)}</Text>
                    <View className="flex-row mt-8">
                      <Text className="text-muted">{item.elderlyName} · {item.roomNo}室</Text>
                      <Text className="alert-level" style={{ color: alertLevelColor(item.alertLevel) }}>
                        {alertLevelLabel(item.alertLevel)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View>
                  <Text className="text-muted">{formatRelativeTime(item.createdAt)}</Text>
                  {item.handledStatus === 0 && (
                    <Text className="tag tag-red">未处理</Text>
                  )}
                  {item.handledStatus === 2 && (
                    <Text className="tag tag-green">已处理</Text>
                  )}
                </View>
              </View>
              <Text className="alert-msg mt-8">{item.alertMessage}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
