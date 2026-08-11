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

/** 获取本地存储的 familyId */
function getFamilyId(): string {
  return Taro.getStorageSync('familyId') || '';
}

/** 获取本地存储的 token */
function getToken(): string {
  return Taro.getStorageSync('token') || '';
}

/** 通用请求封装 */
async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: Record<string, unknown>;
    header?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', data, header = {} } = options;

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
    return res.data as ApiResponse<T>;
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
      openid: code, // 实际流程：前端先 wx.login 获取 code，后端用 code 换 openid
      nickname: nickname || '',
      phone: '',
    },
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
