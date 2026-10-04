import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getMyElderly, getElderlyDevices, bindDeviceSn } from '../../services/api';
import type { ElderlyItem, DeviceItem } from '../../types';
import './devices.scss';

export default function Devices() {
  const router = useRouter();
  const elderIdParam = router.params.elderId ? Number(router.params.elderId) : null;
  const [elders, setElders] = useState<ElderlyItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(elderIdParam);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [showBind, setShowBind] = useState(false);
  const [sn, setSn] = useState('');
  const [category, setCategory] = useState('radar_living');
  const [loading, setLoading] = useState(true);

  const fetchElders = useCallback(async () => {
    const res = await getMyElderly();
    setElders(res.data || []);
    if (!selectedId && res.data && res.data.length > 0) {
      setSelectedId(res.data[0].elderlyId);
    }
  }, [selectedId]);

  const fetchDevices = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await getElderlyDevices(selectedId);
      setDevices(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchElders(); }, []);
  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleBind = async () => {
    if (!sn.trim() || !selectedId) {
      Taro.showToast({ title: '请输入SN并选择老人', icon: 'none' });
      return;
    }
    try {
      await bindDeviceSn({ deviceSn: sn.trim(), elderlyId: selectedId, deviceCategory: category });
      Taro.showToast({ title: '绑定成功', icon: 'success' });
      setSn('');
      setShowBind(false);
      fetchDevices();
    } catch (e: any) {
      Taro.showToast({ title: e.message || '绑定失败', icon: 'none' });
    }
  };

  return (
    <View className='page'>
      <View className='top-bar'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}><Text>‹ 返回</Text></View>
        <Text className='title'>设备管理</Text>
      </View>

      <ScrollView scrollY className='content'>
        {/* 老人切换 */}
        <ScrollView scrollX className='elder-switch'>
          {elders.map((e) => (
            <Text
              key={e.elderlyId}
              className={`chip ${selectedId === e.elderlyId ? 'chip-active' : ''}`}
              onClick={() => setSelectedId(e.elderlyId)}
            >
              {e.elderlyName}
            </Text>
          ))}
        </ScrollView>

        {selectedId && (
          <>
            <View className='card'>
              <View className='row-between'>
                <Text className='card-title'>已绑定设备</Text>
                <View className='btn-small-primary' onClick={() => setShowBind(true)}>+ 添加</View>
              </View>

              {loading && <Text className='muted'>加载中...</Text>}
              {!loading && devices.length === 0 && <Text className='muted'>暂无绑定设备，点击右上角「+ 添加」绑定</Text>}
              {devices.map((d) => (
                <View key={d.id} className='device-row'>
                  <View className='device-icon'>📡</View>
                  <View className='device-info'>
                    <Text className='device-name'>{d.deviceName || d.deviceCategory}</Text>
                    <Text className='muted'>
                      SN: {d.deviceSn} · <Text className={`online-dot ${d.onlineStatus ? 'on' : 'off'}`}></Text>
                      {d.onlineStatus ? '在线' : '离线'}
                    </Text>
                    {d.lastHeartbeat && <Text className='muted small'>最后心跳: {d.lastHeartbeat}</Text>}
                  </View>
                </View>
              ))}
            </View>

            <View className='tip-card'>
              <Text className='tip-title'>💡 如何找到设备 SN？</Text>
              <Text className='tip-desc'>设备底部贴纸或包装盒上通常标注 SN/序列号，直接输入即可绑定。</Text>
            </View>
          </>
        )}

        <View style={{ height: '40px' }} />
      </ScrollView>

      {/* 绑定弹窗 */}
      {showBind && (
        <View className='modal-mask' onClick={() => setShowBind(false)}>
          <View className='modal' onClick={(e) => e.stopPropagation()}>
            <Text className='modal-title'>绑定设备</Text>
            <Text className='muted modal-hint'>SN: {sn}</Text>
            <View className='form-group'>
              <Text className='form-label'>设备SN</Text>
              <Input className='input' placeholder='输入设备序列号' value={sn} onInput={(e) => setSn(e.detail.value)} />
            </View>
            <View className='form-group'>
              <Text className='form-label'>设备类型</Text>
              <View className='category-grid'>
                {[
                  { v: 'radar_living', l: '客厅壁挂雷达' },
                  { v: 'radar_bedhead', l: '床头睡眠雷达' },
                  { v: 'radar_bath', l: '卫生间雷达' },
                  { v: 'door_magnet', l: '门磁' },
                  { v: 'camera', l: '摄像头' },
                  { v: 'infrared', l: '红外探测器' },
                  { v: 'sos_button', l: 'SOS 按钮' },
                  { v: 'smoke_detector', l: '烟雾报警' },
                  { v: 'gas_detector', l: '煤气报警' },
                ].map((c) => (
                  <Text
                    key={c.v}
                    className={`cat-chip ${category === c.v ? 'active' : ''}`}
                    onClick={() => setCategory(c.v)}
                  >{c.l}</Text>
                ))}
              </View>
            </View>
            <View className='modal-actions'>
              <View className='btn-secondary' onClick={() => setShowBind(false)}>取消</View>
              <View className='btn-primary' onClick={handleBind}>绑定</View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
