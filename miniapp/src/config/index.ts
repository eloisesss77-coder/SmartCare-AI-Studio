/** 小程序集中配置 —— 所有可变项从这里取，不硬编码在业务文件里 */

/** 后端 API 基础地址 */
export const API_BASE_URL = 'https://anban.org.cn/api/v1';

/**
 * 微信订阅消息模板 ID
 * 在微信公众平台 → 功能 → 订阅消息 中申请后填入真实 ID
 * 告警相关建议申请 1-2 个模板：跌倒紧急告警、健康异常提醒
 */
export const SUBSCRIBE_TEMPLATE_IDS: string[] = [
  'vPJGPlCdudzcB3C4bnVnH3HF5rO8FSJ0MoPziwq675s', // 跌倒紧急告警
];

/** 隐私协议 storage key */
export const PRIVACY_AGREED_KEY = 'privacyAgreed';

/** 隐私协议版本号（升级协议时递增，强制老用户重新同意） */
export const PRIVACY_VERSION = '1.0';
