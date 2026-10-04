import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getElderlyDetail, getElderlyRadarData, getDailyReports } from '../../services/api';
import VitalPanel from '../../components/vital-panel/vital-panel';
import type { ElderlyInfo, RadarData, DailyReportItem } from '../../types';
import { formatDate, postureLabel, genderLabel, deviceCategoryLabel } from '../../utils/format';
import './elderly-detail.scss';

export default function ElderlyDetail() {
  const router = useRouter();
  const id = Number(router.params.id);

  const [elderly, setElderly] = useState<ElderlyInfo | null>(null);
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'realtime' | 'daily'>('realtime');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [elderlyRes, radarRes] = await Promise.all([
        getElderlyDetail(id),
        getElderlyRadarData(id),
      ]);
      setElderly(elderlyRes.data);
      setRadarData(radarRes.data);
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDaily = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getDailyReports(id, 7);
      setDailyReports(res.data?.reports || []);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchDaily();
    const timer = setInterval(fetchData, 10000);
    return () => clearInterval(timer);
  }, [fetchData]);

  if (loading || !elderly) {
    return (
      <View className="container" style={{ textAlign: 'center', paddingTop: '200px' }}>
        <Text className="text-muted">加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView scrollY className="detail-page">
      {/* 基本信息 */}
      <View className="card">
        <View className="flex-between mb-16">
          <View className="flex-row">
            <Text className="detail-name">{elderly.name}</Text>
            <Text className="tag tag-default ml-8">
              {genderLabel(elderly.gender)} · {elderly.age}岁
            </Text>
          </View>
          <Text className="tag tag-blue">{elderly.roomNo}室</Text>
        </View>
        {elderly.medicalHistory && (
          <View className="detail-row">
            <Text className="detail-label">病史</Text>
            <Text className="detail-value">{elderly.medicalHistory}</Text>
          </View>
        )}
        {elderly.emergencyContact && (
          <View className="detail-row">
            <Text className="detail-label">紧急联系人</Text>
            <Text className="detail-value">{elderly.emergencyContact} {elderly.emergencyPhone}</Text>
          </View>
        )}
      </View>

      {/* Tab 切换 */}
      <View className="tab-bar">
        <View
          className={`tab-item ${activeTab === 'realtime' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('realtime')}
        >
          <Text>实时监控</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'daily' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          <Text>健康日报</Text>
        </View>
      </View>

      {/* 实时监控 */}
      {activeTab === 'realtime' && (
        <View className="card">
          <VitalPanel data={radarData} loading={false} />
        </View>
      )}

      {/* 健康日报 */}
      {activeTab === 'daily' && (
        <View>
          {dailyReports.length === 0 ? (
            <View className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <Text className="text-muted">暂无日报数据</Text>
            </View>
          ) : (
            dailyReports.map((r) => {
              const hrColor = r.heartRateStatus === 'danger' ? '#f5222d' : r.heartRateStatus === 'warning' ? '#fa8c16' : '#52c41a';
              const brColor = r.breathRateStatus === 'danger' ? '#f5222d' : r.breathRateStatus === 'warning' ? '#fa8c16' : '#52c41a';
              return (
                <View key={r.date} className="card daily-card">
                  <View className="flex-between mb-16">
                    <Text className="daily-date">{formatDate(r.date)}</Text>
                    <Text className="text-muted">{r.dataCount}条数据</Text>
                  </View>
                  <View className="daily-vitals">
                    <View className="daily-vital-item">
                      <Text className="daily-vital-label">心率</Text>
                      {r.heartRateAvg !== null ? (
                        <Text className="daily-vital-value" style={{ color: hrColor }}>
                          均{r.heartRateAvg} ({r.heartRateMin}-{r.heartRateMax})
                        </Text>
                      ) : (
                        <Text className="text-muted">无数据</Text>
                      )}
                      <Text className="daily-vital-unit">BPM</Text>
                    </View>
                    <View className="daily-vital-item">
                      <Text className="daily-vital-label">呼吸</Text>
                      {r.breathRateAvg !== null ? (
                        <Text className="daily-vital-value" style={{ color: brColor }}>
                          均{r.breathRateAvg} ({r.breathRateMin}-{r.breathRateMax})
                        </Text>
                      ) : (
                        <Text className="text-muted">无数据</Text>
                      )}
                      <Text className="daily-vital-unit">次/分</Text>
                    </View>
                  </View>
                  <View className="daily-footer">
                    {r.fallCount > 0 ? (
                      <Text className="tag tag-red mr-8">跌倒{r.fallCount}次</Text>
                    ) : (
                      <Text className="tag tag-green mr-8">无跌倒</Text>
                    )}
                    {r.alertCount > 0 ? (
                      <Text className="tag tag-orange">{r.alertCount}条告警</Text>
                    ) : (
                      <Text className="tag tag-green">无告警</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      <View style={{ height: '40px' }} />
    </ScrollView>
  );
}
