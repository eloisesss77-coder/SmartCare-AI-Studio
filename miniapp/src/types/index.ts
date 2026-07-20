/** 类型定义 - 与后端 API 响应对齐 */

export interface FamilyInfo {
  familyId: number;
  openid: string;
  nickname: string;
  phone: string;
  elderlyList: BindingItem[];
}

export interface BindingItem {
  elderlyId: number;
  elderlyName: string;
  roomNo: string;
  relation: string;
  isPrimary: number;
}

export interface MyElderlyItem {
  elderlyId: number;
  elderlyName: string;
  roomNo: string;
  age: number;
  gender: number;
  relation: string;
  isPrimary: number;
  latestRadarData: RadarSnapshot | null;
  devices: DeviceBrief[];
  unreadAlerts: number;
  todayAlerts: number;
  status: string;
}

export interface RadarSnapshot {
  heartRate: number | null;
  breathRate: number | null;
  fallStatus: number;
  inBed: number;
  bodyPosture: string;
  activityLevel: string;
  timestamp: string | null;
}

export interface DeviceBrief {
  deviceSn: string;
  deviceName: string;
  deviceCategory: string;
  onlineStatus: number;
  batteryLevel: number | null;
}

export interface RadarData {
  id: number;
  deviceSn: string;
  elderId: number;
  elderName: string;
  roomNo: string;
  fallStatus: number;
  heartRate: number;
  breathRate: number;
  activityLevel: string;
  inBed: number;
  bodyPosture: string;
  timestamp: string;
}

export interface AlertItem {
  id: number;
  elderId: number;
  elderName: string;
  roomNo: string;
  alertType: string;
  alertLevel: string;
  alertMessage: string;
  triggerValue: string;
  handledStatus: number;
  handledBy: string;
  handledAt: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DailyReportItem {
  date: string;
  heartRateAvg: number | null;
  heartRateMin: number | null;
  heartRateMax: number | null;
  heartRateStatus: string;
  breathRateAvg: number | null;
  breathRateMin: number | null;
  breathRateMax: number | null;
  breathRateStatus: string;
  fallCount: number;
  alertCount: number;
  dataCount: number;
}

export interface ElderlyInfo {
  id: number;
  name: string;
  age: number;
  gender: number;
  roomNo: string;
  medicalHistory: string;
  emergencyContact: string;
  emergencyPhone: string;
  radarDeviceSn: string;
  status: number;
  createdAt: string;
}
