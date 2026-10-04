import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getAlerts, acknowledgeAlert, getAlertRules } from '../../services/api';
import type { AlertItem, AlertRuleItem } from '../../types';
import './alerts.scss';

export default function Alerts() {
  const [list, setList] = useState<AlertItem[]>([]);
  const [rules, setRules] = useState<AlertRuleItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const ack = unreadOnly ? 0 : undefined;
      const [alertsRes, rulesRes] = await Promise.all([
        getAlerts({ page: 1, pageSize: 50, acknowledged: ack }),
        getAlertRules(),
      ]);
      setList(alertsRes.data?.list || []);
      setRules(rulesRes.data || []);
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useDidShow(fetchData);

  const handleAck = async (id: number) => {
    try {
      await acknowledgeAlert(id);
      Taro.showToast({ title: '已确认安全', icon: 'success' });
      fetchData();
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const levelStyle = (lvl: string) => {
    if (lvl === 'emergency' || lvl === 'critical') return 'level-red';
    if (lvl === 'warning') return 'level-orange';
    return 'level-blue';
  };

  const levelLabel = (lvl: string) => ({
    emergency: '紧急', critical: '重要', warning: '一般', info: '提示',
  } as any)[lvl] || lvl;

  return (
    <View className='page'>
      <View className='top-bar'>
        <Text className='title'>告警中心</Text>
        <View className='filter-row'>
          <Text className={`filter-chip ${unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(true); fetchData(); }}>
            未处理
          </Text>
          <Text className={`filter-chip ${!unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(false); fetchData(); }}>
            全部
          </Text>
        </View>
      </View>

      {loading && <View className='loading'><Text className='muted'>加载中...</Text></View>}

      <ScrollView scrollY className='content'>
        {!loading && list.length === 0 && (
          <View className='empty'>
            <Text className='empty-icon'>✓</Text>
            <Text className='empty-title'>暂无告警</Text>
            <Text className='empty-desc'>守护运行正常，无需担心</Text>
          </View>
        )}

        {list.map((a) => {
          const isCritical = a.alert_level === 'emergency' || a.alert_level === 'critical';
          return (
            <View key={a.id} className={`alert-card ${isCritical ? 'critical' : ''}`}>
              <View className='alert-header'>
                <Text className={`alert-type ${levelStyle(a.alert_level)}`}>
                  {isCritical ? '⚠️ ' : ''}{a.alertMessage.split('。')[0] || a.alertType}
                </Text>
                <Text className={`level-tag ${levelStyle(a.alert_level)}`}>{levelLabel(a.alert_level)}</Text>
              </View>
              <Text className='alert-elder'>{a.elderlyName} · {a.alertMessage}</Text>
              <Text className='alert-time'>{a.createdAt}</Text>

              {a.familyAcknowledged === 0 && (
                <View className='btn-primary btn-full btn-small' onClick={() => handleAck(a.id)}>
                  我已确认老人安全
                </View>
              )}
              {a.familyAcknowledged === 1 && (
                <Text className='ack-tag'>✓ 已确认安全</Text>
              )}
            </View>
          );
        })}

        {/* 告警规则（原型底部有） */}
        <Text className='section-title'>告警规则</Text>
        <View className='card'>
          {rules.map((r) => (
            <View key={r.id} className='rule-row'>
              <Text className='rule-name'>{r.ruleTypeLabel}</Text>
              <Text className={`level-tag ${r.severity === 'emergency' || r.severity === 'critical' ? 'level-red' : 'level-blue'}`}>
                {r.severityLabel}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: '40px' }} />
      </ScrollView>
    </View>
  );
}
