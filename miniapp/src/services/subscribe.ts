/** 微信订阅消息授权封装 */
import Taro from '@tarojs/taro';
import { SUBSCRIBE_TEMPLATE_IDS } from '../config';

/**
 * 请求订阅消息授权
 * 必须由用户点击触发（如绑定成功、首次进入首页），否则微信会拒绝弹窗
 */
export async function requestSubscribe(): Promise<{ success: boolean; accepted: boolean }> {
  const validIds = SUBSCRIBE_TEMPLATE_IDS.filter((id) => id && !id.startsWith('REPLACE_'));

  if (validIds.length === 0) {
    console.warn('[subscribe] 未配置有效模板 ID，跳过订阅请求');
    return { success: false, accepted: false };
  }

  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: validIds,
    });

    // 只要有一个模板被接受就算成功
    const accepted = Object.values(res).some((v) => v === 'accept');
    console.log('[subscribe] 授权结果:', JSON.stringify(res), 'accepted:', accepted);

    return { success: true, accepted };
  } catch (err: any) {
    console.warn('[subscribe] 订阅请求失败:', err?.errMsg || err);
    return { success: false, accepted: false };
  }
}
