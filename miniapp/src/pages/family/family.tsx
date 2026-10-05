import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getFamilyMe } from '../../services/api';
import type { FamilyMe } from '../../types';
import './family.scss';

export default function Family() {
  const [data, setData] = useState<FamilyMe | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await getFamilyMe();
      setData(res.data || null);
    } catch {}
  }, []);

  useDidShow(fetch);

  return (
    <View className='page'>
      <View className='top-bar'>
        <Text className='title'>我的家庭</Text>
        <Text className='sub'>{data?.familyName || '家庭'} · 成员与权限</Text>
      </View>

      <ScrollView scrollY className='content'>
        {data && (
          <>
            <View className='card family-header'>
              <View className='row-between'>
                <Text className='family-name'>{data.familyName}</Text>
                <Text className='tag-blue'>{data.myRole === 'admin' ? '管理员' : '成员'}</Text>
              </View>
              <Text className='muted'>
                {data.elderlyCount}位老人 · {data.members.length}位成员 · {data.deviceCount}台设备
              </Text>
            </View>

            <Text className='section-title'>成员</Text>
            <View className='card'>
              {data.members.map((m) => (
                <View key={m.familyId} className='member-row'>
                  <View className='avatar small'>👩</View>
                  <View className='member-info'>
                    <View className='row-between'>
                      <Text className='member-name'>{m.nickname || '家属用户'}</Text>
                      {m.isMe && <Text className='tag-green'>我</Text>}
                    </View>
                    <Text className='muted'>
                      {m.role === 'admin' ? '管理员 · 可查看全部老人' : '普通成员'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: '40px' }} />
      </ScrollView>
    </View>
  );
}
