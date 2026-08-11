/** API 服务层 — 封装所有后端接口 */
import Taro from '@tarojs/taro';
import type {
  ApiResponse,
  FamilyInfo,
  MyElderlyItem,
  RadarData,
  AlertItem,
  PaginatedData,
  ElderlyInfo,
  DailyReportItem,
} from '../types';

/** 后端基础 URL（需在小程序后台配置 request 合法域名） */
const BASE_URL = 'https://anban.org.cn/api/v1';

// 注意：微信开发者工具中开发测试可关闭「不校验合法域名」
// 正式版需在小程序后台配置 request 合法域名为 anban.org.cn

// ---------- 认证竞态控制 ----------

let _loginReady = false;

/** app.tsx 登录完成后调用，通知 api 层可以安全发请求 */
export function setLoginReady() {
  _loginReady = true;
}

/** 等待登录完成（最多等 10 秒），确保 familyId 已写入 storage */
async function ensureAuth(): Promise<void> {
  if (_loginReady) return;
  // 轮询等待，最长 10 秒
  for (let i = 0; i < 40; i++) {
    if (_loginReady || Taro.getStorageSync('familyId')) return;
    await new Promise(r => setTimeout(r, 250));
  }
}

// ---------- Storage 工具 ----------

/** 获取本地存储的 familyId */
function getFamilyId(): string {
  return Taro.getStorageSync('familyId') || '';
}

/** 获取本地存储的 token */
function getToken(): string {
  return Taro.getStorageSync('token') || '';
}

// ---------- 请求封装 ----------

/** 通用请求封装 */
async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: Record<string, unknown>;
    header?: Record<string, string>;
    needAuth?: boolean;  // 是否需要等待登录完成
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', data, header = {}, needAuth = true } = options;

  if (needAuth) {
    await ensureAuth();
  }

  const res = await Taro.request({
    url: `${BASE_URL}${path}`,
    method: method as any,
    data,
    header: {
      'Content-Type': 'application/json',
      'X-Family-Id': getFamilyId(),
      Authorization: `Bearer ${getToken()}`,
      ...header,
    },
  });

  if (res.statusCode >= 200 && res.statusCode < 300) {
    const body = res.data as any;
    // 业务层 code 字段检查：code 存在且不为 0/200 时视为业务错误
    if (body && typeof body.code === 'number' && body.code !== 0 && body.code !== 200) {
      if (body.code === 401 || body?.detail === 'Not authenticated') {
        Taro.showToast({ title: '登录已过期，请重启小程序', icon: 'none', duration: 2500 });
        throw new Error('认证已过期');
      }
      const msg = body.message || body.detail || `业务错误(code=${body.code})`;
      throw new Error(msg);
    }
    return body as ApiResponse<T>;
  }
  // 提取后端返回的错误信息
  const body = res.data as any;
  const msg = body?.detail || body?.message || `请求失败(${res.statusCode})`;
  throw new Error(msg);
}

// ===================== 登录 =====================

/** 微信登录：wx.login 获取 code → 后端换取 openid */
export async function familyLogin(code: string, nickname?: string): Promise<ApiResponse<FamilyInfo>> {
  return request<FamilyInfo>('/family/register', {
    method: 'POST',
    data: {
      openid: code,
      nickname: nickname || '',
      phone: '',
    },
    needAuth: false,
  });
}

// ===================== 首页 =====================

/** 获取当前家属绑定的所有老人 + 实时数据 */
export async function getMyElderly(): Promise<ApiResponse<MyElderlyItem[]>> {
  return request<MyElderlyItem[]>('/family/my-elderly');
}

// ===================== 老人 =====================

/** 老人详情 */
export async function getElderlyDetail(id: number): Promise<ApiResponse<ElderlyInfo>> {
  return request<ElderlyInfo>(`/family/elderly/${id}`);
}

/** 老人最新雷达数据 */
export async function getElderlyRadarData(id: number): Promise<ApiResponse<RadarData>> {
  return request<RadarData>(`/family/elderly/${id}/radar-data`);
}

/** 老人健康日报 */
export async function getDailyReports(id: number, days: number = 7): Promise<ApiResponse<{ reports: DailyReportItem[] }>> {
  return request<{ reports: DailyReportItem[] }>(`/family/elderly/${id}/daily-reports?days=${days}`);
}

/** 雷达历史数据（暂不用） */
export async function getRadarHistory(elderId: number, hours: number = 24): Promise<ApiResponse<PaginatedData<RadarData>>> {
  return request<PaginatedData<RadarData>>(`/radar/data/history?elderId=${elderId}&hours=${hours}`);
}

// ===================== 告警 =====================

/** 获取告警列表 */
export async function getAlertList(params: {
  page?: number;
  pageSize?: number;
  elderlyId?: number;
  alertLevel?: string;
  handledStatus?: number;
}): Promise<ApiResponse<PaginatedData<AlertItem>>> {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return request<PaginatedData<AlertItem>>(`/family/alerts?${query}`);
}

/** 告警详情 */
export async function getAlertDetail(id: number): Promise<ApiResponse<AlertItem>> {
  return request<AlertItem>(`/family/alerts/${id}`);
}

/** 处理告警（标记已读） */
export async function handleAlert(id: number, remark: string = '已阅'): Promise<ApiResponse<null>> {
  return request<null>(`/family/alerts/${id}/handle`, {
    method: 'PUT',
    data: {
      handledStatus: 2,
      handledBy: '家属',
      handleRemark: remark,
    },
  });
}

// ===================== 绑定 =====================

/** 使用绑定码绑定老人 */
export async function useBindCode(bindCode: string, relation: string = '子女'): Promise<ApiResponse<{ elderlyId: number; elderlyName: string; roomNo: string }>> {
  return request('/family/use-bind-code', {
    method: 'POST',
    data: { bindCode, relation },
  });
}

/** 解绑老人 */
export async function unbindElderly(bindingId: number): Promise<ApiResponse<null>> {
  return request<null>(`/family/unbind/${bindingId}`, {
    method: 'DELETE',
  });
}
