/** 小程序 API 服务层 —— 按原型重构 */
import Taro from '@tarojs/taro';
import type {
  ApiResponse, FamilyInfo, FamilyMe, ElderlyItem, ElderlyDetail,
  DeviceItem, AlertItem, AlertRuleItem, DailyReport, WeeklyReport,
  TrendPoint, NotificationSettings, PaginatedData,
} from '../types';

const BASE_URL = 'https://anban.org.cn/api/v1';

function getFamilyId(): string {
  return Taro.getStorageSync('familyId') || '';
}

function getToken(): string {
  return Taro.getStorageSync('token') || '';
}

async function request<T>(
  path: string,
  options: { method?: string; data?: any; needAuth?: boolean } = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', data, needAuth = true } = options;

  if (needAuth) {
    // 等待登录完成（最多 10s）
    for (let i = 0; i < 40; i++) {
      if (getFamilyId()) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  const res = await Taro.request({
    url: `${BASE_URL}${path}`,
    method: method as any,
    data,
    header: {
      'Content-Type': 'application/json',
      'X-Family-Id': getFamilyId(),
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const body = res.data as any;
  if (res.statusCode >= 200 && res.statusCode < 300) {
    if (body?.code !== undefined && body.code !== 0 && body.code !== 200) {
      throw new Error(body.message || `请求失败(${body.code})`);
    }
    return body as ApiResponse<T>;
  }
  const msg = body?.detail || body?.message || `HTTP ${res.statusCode}`;
  throw new Error(msg);
}

// ========== 登录 ==========
export function familyLogin(code: string, nickname?: string): Promise<ApiResponse<FamilyInfo>> {
  return request<FamilyInfo>('/family/wx-login', {
    method: 'POST',
    data: { code, nickname: nickname || '' },
    needAuth: false,
  });
}

// ========== 家庭 ==========
export function getFamilyMe(): Promise<ApiResponse<FamilyMe>> {
  return request<FamilyMe>('/family/me');
}

export function getNotifications(): Promise<ApiResponse<NotificationSettings>> {
  return request<NotificationSettings>('/family/notifications');
}

export function updateNotifications(settings: Partial<NotificationSettings>) {
  return request('/family/notifications', { method: 'PUT', data: settings });
}

// ========== 老人 ==========
export function getMyElderly(): Promise<ApiResponse<ElderlyItem[]>> {
  return request<ElderlyItem[]>('/family/my-elderly');
}

export function getElderlyDetail(id: number): Promise<ApiResponse<ElderlyDetail>> {
  return request<ElderlyDetail>(`/family/elderly/${id}`);
}

export function getElderlyDevices(id: number): Promise<ApiResponse<DeviceItem[]>> {
  return request<DeviceItem[]>(`/family/elderly/${id}/devices`);
}

// ========== 设备 ==========
export function bindDeviceSn(data: { deviceSn: string; elderlyId: number; deviceCategory?: string; deviceName?: string }) {
  return request('/family/bind-device', { method: 'POST', data });
}

// ========== 告警 ==========
export function getAlerts(params: { page?: number; pageSize?: number; acknowledged?: number; alertLevel?: string }) {
  const q = Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${v}`).join('&');
  return request<PaginatedData<AlertItem>>(`/family/alerts${q ? '?' + q : ''}`);
}

export function acknowledgeAlert(id: number) {
  return request(`/family/alerts/${id}/acknowledge`, { method: 'PUT' });
}

export function getAlertRules(): Promise<ApiResponse<AlertRuleItem[]>> {
  return request<AlertRuleItem[]>('/family/rules');
}

// ========== 报告 ==========
export function getDailyReport(id: number, date?: string): Promise<ApiResponse<DailyReport>> {
  return request<DailyReport>(`/family/elderly/${id}/report/daily${date ? '?date=' + date : ''}`);
}

export function getWeeklyReport(id: number): Promise<ApiResponse<WeeklyReport>> {
  return request<WeeklyReport>(`/family/elderly/${id}/report/weekly`);
}

export function getTrend(id: number, hours: number = 24): Promise<ApiResponse<TrendPoint[]>> {
  return request<TrendPoint[]>(`/family/elderly/${id}/report/trend?hours=${hours}`);
}

// ========== 绑定 ==========
export function useBindCode(bindCode: string, relation: string = '子女') {
  return request('/family/use-bind-code', { method: 'POST', data: { bindCode, relation } });
}
