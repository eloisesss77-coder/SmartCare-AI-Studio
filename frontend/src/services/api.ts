import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';
import config from '@/config';
import type {
  ApiResponse,
  DashboardOverview,
  AlertTrend,
  AlertRecord,
  Elderly,
  RadarData,
  RadarDevice,
  PaginatedResponse,
  HandleAlertRequest,
  LoginRequest,
  LoginResponse,
  UserInfo,
  UserRecord,
  ChangePasswordRequest,
  DeviceGeneric,
  DeviceCategory,
  DeviceStatsSummary,
  BindCodeResponse,
  AlertRule,
  DailyReportItem,
} from '@/types';

const instance: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    const res = response.data;
    if (res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(error.response.data?.message || '网络错误');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请重试');
    } else {
      message.error('网络连接失败，请检查网络');
    }
    return Promise.reject(error);
  }
);

// ==================== Dashboard ====================

export const getDashboardOverview = (): Promise<ApiResponse<DashboardOverview>> =>
  instance.get('/dashboard/overview').then((res) => res.data);

export const getAlertTrend = (days: number = 7): Promise<ApiResponse<AlertTrend[]>> =>
  instance.get('/dashboard/alert-trend', { params: { days } }).then((res) => res.data);

export const getDeviceStatus = (): Promise<ApiResponse<unknown>> =>
  instance.get('/dashboard/device-status').then((res) => res.data);

// ==================== Elderly ====================

export const getElderlyList = (params: {
  page: number;
  pageSize: number;
  keyword?: string;
}): Promise<ApiResponse<PaginatedResponse<Elderly>>> =>
  instance.get('/elderly', { params }).then((res) => res.data);

export const getElderlyDetail = (id: number): Promise<ApiResponse<Elderly>> =>
  instance.get(`/elderly/${id}`).then((res) => res.data);

export const createElderly = (data: Partial<Elderly>): Promise<ApiResponse<null>> =>
  instance.post('/elderly', data).then((res) => res.data);

export const updateElderly = (id: number, data: Partial<Elderly>): Promise<ApiResponse<null>> =>
  instance.put(`/elderly/${id}`, data).then((res) => res.data);

export const deleteElderly = (id: number): Promise<ApiResponse<null>> =>
  instance.delete(`/elderly/${id}`).then((res) => res.data);

export const getElderlyRadarData = (id: number): Promise<ApiResponse<RadarData>> =>
  instance.get(`/elderly/${id}/radar-data`).then((res) => res.data);

export const getDailyReports = (
  id: number,
  days: number = 7
): Promise<ApiResponse<{ elderlyId: number; elderlyName: string; days: number; reports: DailyReportItem[] }>> =>
  instance.get(`/elderly/${id}/daily-reports`, { params: { days } }).then((res) => res.data);

// ==================== Radar ====================

export const getRadarDevices = (): Promise<ApiResponse<RadarDevice[]>> =>
  instance.get('/radar/devices').then((res) => res.data);

export const getRadarDataHistory = (params: {
  elderId: number;
  start: string;
  end: string;
}): Promise<ApiResponse<PaginatedResponse<RadarData>>> =>
  instance.get('/radar/data/history', { params }).then((res) => res.data);

// ==================== Auth ====================

export const loginApi = (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
  instance.post('/auth/login', data).then((res) => res.data);

export const getCurrentUser = (): Promise<ApiResponse<UserInfo>> =>
  instance.get('/auth/me').then((res) => res.data);

export const changePassword = (data: ChangePasswordRequest): Promise<ApiResponse<null>> =>
  instance.post('/auth/change-password', data).then((res) => res.data);

// ==================== User Management ====================

export const getUserList = (params: { page: number; pageSize: number; keyword?: string }): Promise<ApiResponse<PaginatedResponse<UserRecord>>> =>
  instance.get('/users', { params }).then((res) => res.data);

export const createUser = (data: Partial<UserRecord> & { password?: string }): Promise<ApiResponse<null>> =>
  instance.post('/users', data).then((res) => res.data);

export const updateUser = (id: number, data: Partial<UserRecord>): Promise<ApiResponse<null>> =>
  instance.put(`/users/${id}`, data).then((res) => res.data);

export const updateUserStatus = (id: number, status: number): Promise<ApiResponse<null>> =>
  instance.put(`/users/${id}/status`, { status }).then((res) => res.data);

// ==================== Alerts ====================

export const getAlertList = (params: {
  page: number;
  pageSize: number;
  alertLevel?: string;
  handledStatus?: number;
  start?: string;
  end?: string;
}): Promise<ApiResponse<PaginatedResponse<AlertRecord>>> =>
  instance.get('/alerts', { params }).then((res) => res.data);

export const getAlertDetail = (id: number): Promise<ApiResponse<AlertRecord>> =>
  instance.get(`/alerts/${id}`).then((res) => res.data);

export const handleAlert = (id: number, data: HandleAlertRequest): Promise<ApiResponse<null>> =>
  instance.put(`/alerts/${id}/handle`, data).then((res) => res.data);

// ==================== 告警规则 ====================

export const getAlertRules = (params?: {
  page?: number;
  pageSize?: number;
  ruleType?: string;
}): Promise<ApiResponse<PaginatedResponse<AlertRule>>> =>
  instance.get('/alerts/rules', { params }).then((res) => res.data);

export const createAlertRule = (data: {
  ruleName: string;
  ruleType: string;
  elderId?: number | null;
  thresholdValue: string;
  severity?: string;
  notifyChannels?: string;
}): Promise<ApiResponse<AlertRule>> =>
  instance.post('/alerts/rules', data).then((res) => res.data);

export const updateAlertRule = (id: number, data: Record<string, unknown>): Promise<ApiResponse<AlertRule>> =>
  instance.put(`/alerts/rules/${id}`, data).then((res) => res.data);

export const deleteAlertRule = (id: number): Promise<ApiResponse<null>> =>
  instance.delete(`/alerts/rules/${id}`).then((res) => res.data);

// ==================== 通用设备管理（NEW） ====================

export const getDeviceCategories = (): Promise<ApiResponse<DeviceCategory[]>> =>
  instance.get('/devices/categories').then((res) => res.data);

export const getDeviceList = (params: {
  page: number;
  pageSize: number;
  category?: string;
  roomNo?: string;
  onlineStatus?: number;
}): Promise<ApiResponse<PaginatedResponse<DeviceGeneric>>> =>
  instance.get('/devices', { params }).then((res) => res.data);

export const getDeviceDetail = (id: number): Promise<ApiResponse<DeviceGeneric>> =>
  instance.get(`/devices/${id}`).then((res) => res.data);

export const registerDevice = (data: {
  deviceSn: string;
  deviceName?: string;
  deviceCategory: string;
  deviceBrand?: string;
  deviceModel?: string;
  roomNo?: string;
  elderId?: number;
  extraConfig?: string;
}): Promise<ApiResponse<{ id: number; deviceSn: string }>> =>
  instance.post('/devices', data).then((res) => res.data);

export const updateDevice = (id: number, data: Partial<DeviceGeneric>): Promise<ApiResponse<null>> =>
  instance.put(`/devices/${id}`, data).then((res) => res.data);

export const deleteDevice = (id: number): Promise<ApiResponse<null>> =>
  instance.delete(`/devices/${id}`).then((res) => res.data);

export const getDeviceStats = (): Promise<ApiResponse<DeviceStatsSummary>> =>
  instance.get('/devices/stats/summary').then((res) => res.data);

export const sendDeviceCommand = (id: number, command: Record<string, unknown>): Promise<ApiResponse<null>> =>
  instance.post(`/devices/${id}/command`, command).then((res) => res.data);

// ==================== 家属绑定码（NEW） ====================

export const generateBindCode = (data: { elderlyId: number; relation: string }): Promise<ApiResponse<BindCodeResponse>> =>
  instance.post('/family/generate-bind-code', data).then((res) => res.data);

export default instance;
