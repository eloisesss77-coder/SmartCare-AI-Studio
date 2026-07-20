export interface Elderly {
  id: number;
  name: string;
  age: number;
  gender: number; // 0=未知 1=男 2=女
  roomNo: string;
  medicalHistory: string;
  emergencyContact: string;
  emergencyPhone: string;
  radarDeviceSn: string;
  status: number;
  createdAt: string;
}

export interface RadarData {
  id: number;
  deviceSn: string;
  elderId: number;
  elderName: string;
  roomNo: string;
  fallStatus: number;      // 0=正常 1=跌倒
  heartRate: number;
  breathRate: number;
  activityLevel: number;
  inBed: number;           // 0=离床 1=在床
  bodyPosture: string;     // standing/sitting/lying/walking
  timestamp: string;
}

export interface AlertRecord {
  id: number;
  elderId: number;
  elderName: string;
  roomNo: string;
  alertType: string;       // fall/heart_rate/breath_rate/inactivity/offline/manual_sos/smoke_alarm/gas_leak/door_open_long
  alertLevel: string;       // info/warning/critical/emergency
  alertMessage: string;
  triggerValue: string;
  handledStatus: number;   // 0=未处理 1=处理中 2=已处理
  handledBy: string;
  handledAt: string;
  createdAt: string;
}

export interface DashboardOverview {
  totalElderly: number;
  onlineDevices: number;
  activeAlerts: number;
  fallCountToday: number;
  roomStatusList: RoomStatus[];
}

export interface RoomStatus {
  roomNo: string;
  elderName: string;
  inBed: number;
  fallStatus: number;
  heartRate: number;
  online: boolean;
}

export interface AlertTrend {
  date: string;
  total: number;
  fall: number;
  heartRate: number;
  breathRate: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface RadarDevice {
  id: number;
  deviceSn: string;
  roomNo: string;
  status: number;
  elderId: number;
  elderName: string;
  createdAt: string;
}

// ==================== 通用设备 ====================

export interface DeviceGeneric {
  id: number;
  deviceSn: string;
  deviceName: string;
  deviceCategory: string;  // radar_fall/radar_bedside/infrared/door_magnet/camera/sos_button/smoke_detector/gas_detector
  deviceBrand: string;
  deviceModel: string;
  roomNo: string;
  elderId: number | null;
  elderName: string;
  institutionId: number;
  onlineStatus: number;    // 0=离线 1=在线
  batteryLevel: number | null;
  signalStrength: number | null;
  lastHeartbeat: string | null;
  extraConfig: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCategory {
  value: string;
  label: string;
  icon: string;
}

export interface DeviceStatsSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  byCategory: {
    category: string;
    label: string;
    icon: string;
    total: number;
    online: number;
    offline: number;
  }[];
}

// ==================== 绑定码 ====================

export interface BindCodeResponse {
  id: number;
  bindCode: string;
  elderlyId: number;
  elderlyName: string;
  roomNo: string;
  relation: string;
  expireAt: string;
}

// ==================== 告警 ====================

export interface HandleAlertRequest {
  handledStatus: number;
  handledBy: string;
  handleRemark?: string;
}

// ==================== 认证 ====================

export interface UserInfo {
  id: number;
  username: string;
  displayName: string;
  role: string;
  institutionId: number;
  phone?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface UserRecord {
  id: number;
  username: string;
  displayName: string;
  role: string;
  phone: string;
  status: number;
  elderlyIds: number[];
  createdAt: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ==================== 告警规则 ====================

export interface AlertRule {
  id: number;
  ruleName: string;
  ruleType: string;         // fall / heart_rate / breath_rate / out_of_bed / inactivity
  elderId: number | null;   // null = 全局规则
  thresholdValue: string;   // JSON: {"min":50,"max":100} / {"fall_status":1} / {"max_minutes":30}
  severity: string;          // info / warning / critical / emergency
  enabled: number;          // 0=禁用 1=启用
  notifyChannels: string;   // dingtalk,wecom,sms,wechat
  createdAt?: string;
  updatedAt?: string;
}

// ==================== 健康日报 ====================

export interface DailyReportItem {
  date: string;
  heartRateAvg: number | null;
  heartRateMin: number | null;
  heartRateMax: number | null;
  heartRateStatus: string;   // normal / warning / danger
  breathRateAvg: number | null;
  breathRateMin: number | null;
  breathRateMax: number | null;
  breathRateStatus: string;  // normal / warning / danger
  fallCount: number;
  alertCount: number;
  dataCount: number;
}

export interface DailyReportsResponse {
  elderlyId: number;
  elderlyName: string;
  days: number;
  reports: DailyReportItem[];
}
