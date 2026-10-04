import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getMyElderly, getDailyReport, getWeeklyReport, getTrend } from '../../services/api';
import type { ElderlyItem, DailyReport, WeeklyReport, TrendPoint } from '../../types';
import './reports.scss';

export default function Reports() {
  const [elders, setElders] = useState<ElderlyItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const res = await getMyElderly();
      const list = res.data || [];
      setElders(list);
      if (list.length > 0 && selectedId === null) setSelectedId(list[0].elderlyId);
    } catch {}
  }, [selectedId]);

  const fetchReport = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      if (mode === 'daily') {
        const [dRes, tRes] = await Promise.all([
          getDailyReport(selectedId),
          getTrend(selectedId, 24),
        ]);
        setDaily(dRes.data || null);
        setTrend(tRes.data || []);
      } else {
        const wRes = await getWeeklyReport(selectedId);
        setWeekly(wRes.data || null);
      }
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [selectedId, mode]);

  useDidShow(() => { fetchAll(); fetchReport(); });

  if (elders.length === 0) {
    return (
      <View className='page'>
        <View className='top-bar'><Text className='title'>健康报告</Text></View>
        <View className='empty'>
          <Text className='empty-title'>请先绑定老人</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='page'>
      <View className='top-bar'>
        <Text className='title'>健康报告</Text>
      </View>

      <ScrollView scrollY className='content'>
        {/* 老人切换 */}
        <ScrollView scrollX className='elder-switch'>
          {elders.map((e) => (
            <Text
              key={e.elderlyId}
              className={`chip ${selectedId === e.elderlyId ? 'chip-active' : ''}`}
              onClick={() => { setSelectedId(e.elderlyId); setDaily(null); setWeekly(null); fetchReport(); }}
            >
              {e.elderlyName}
            </Text>
          ))}
        </ScrollView>

        {/* 日/周切换 */}
        <View className='tab-switch'>
          <Text className={`tab ${mode === 'daily' ? 'tab-active' : ''}`} onClick={() => { setMode('daily'); fetchReport(); }}>日报</Text>
          <Text className={`tab ${mode === 'weekly' ? 'tab-active' : ''}`} onClick={() => { setMode('weekly'); fetchReport(); }}>周报</Text>
        </View>

        {loading && <View className='loading'><Text className='muted'>加载中...</Text></View>}

        {mode === 'daily' && daily && (
          <>
            <View className='card'>
              <View className='card-head'>
                <Text className='card-title'>{daily.date} · 日报</Text>
                <Text className='tag-green'>{daily.avgHeartRate ? '良好' : '暂无数据'}</Text>
              </View>
              <View className='metric-grid'>
                <View className='metric'>
                  <Text className='metric-big'>{daily.avgHeartRate ?? '--'}</Text>
                  <Text className='metric-label'>平均心率</Text>
                </View>
                <View className='metric'>
                  <Text className='metric-big'>{daily.sleepHours ?? '--'}</Text>
                  <Text className='metric-label'>睡眠时长(h)</Text>
                </View>
                <View className='metric'>
                  <Text className='metric-big'>{daily.toiletCount ?? 0}</Text>
                  <Text className='metric-label'>如厕次数</Text>
                </View>
                <View className='metric'>
                  <Text className='metric-big'>{daily.fallCount ?? 0}</Text>
                  <Text className='metric-label'>跌倒次数</Text>
                </View>
              </View>
            </View>

            {/* 活动趋势图 */}
            <View className='card'>
              <Text className='card-title'>活动趋势（24小时）</Text>
              <View className='chart'>
                {trend.length === 0 && <Text className='muted'>暂无数据</Text>}
                {trend.map((p, i) => (
                  <View key={i} className='bar-wrap'>
                    <View
                      className='bar'
                      style={{ height: `${Math.min(100, p.activityScore * 25)}%` }}
                    />
                  </View>
                ))}
              </View>
              {trend.length > 0 && (
                <View className='chart-legend'>
                  <Text className='muted'>00:00</Text>
                  <Text className='muted'>06:00</Text>
                  <Text className='muted'>12:00</Text>
                  <Text className='muted'>18:00</Text>
                </View>
              )}
            </View>

            {/* AI 摘要 */}
            <View className='card'>
              <Text className='card-title'>AI 健康摘要</Text>
              <Text className='ai-summary'>{daily.aiSummary || '暂无摘要'}</Text>
            </View>
          </>
        )}

        {mode === 'weekly' && weekly && (
          <View className='card'>
            <Text className='card-title'>{weekly.startDate} ~ {weekly.endDate} · 周报</Text>
            <View className='metric-grid'>
              <View className='metric'>
                <Text className='metric-big'>{weekly.summary.avgHeartRate}</Text>
                <Text className='metric-label'>平均心率</Text>
              </View>
              <View className='metric'>
                <Text className='metric-big'>{weekly.summary.avgSleepHours}</Text>
                <Text className='metric-label'>平均睡眠(h)</Text>
              </View>
              <View className='metric'>
                <Text className='metric-big'>{weekly.summary.totalFallCount}</Text>
                <Text className='metric-label'>总跌倒次数</Text>
              </View>
              <View className='metric'>
                <Text className='metric-big'>{weekly.summary.totalAlertCount}</Text>
                <Text className='metric-label'>总告警</Text>
              </View>
            </View>
            <Text className='card-title' style={{ marginTop: 16 }}>AI 周报摘要</Text>
            <Text className='ai-summary'>{weekly.aiSummary}</Text>
          </View>
        )}

        <View style={{ height: '40px' }} />
      </ScrollView>
    </View>
  );
}
