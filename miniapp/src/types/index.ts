/** 类型定义 —— 按原型重构 */

// 通用
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}

// 登录 / 家庭
export interface FamilyInfo {
  familyId: number;
  nickname: string;
  avatarUrl?: string;
  familyName: string;
  familyRole: 'admin' | 'member';
}

export interface FamilyMember {
  familyId: number;
  nickname: string;
  avatarUrl?: string;
  role: string;
  isMe: boolean;
}

export interface FamilyMe {
  familyId: number;
  familyName: string;
  myRole: string;
  elderlyCount: number;
  deviceCount: number;
  unreadAlerts: number;
  pendingAlerts: number;
  members: FamilyMember[];
}

// 老人
export interface RadarDataSnapshot {
  heartRate: number | null;
  breathRate: number | null;
  fallStatus: number;
  inBed: number;
  activityLevel: string;
  timestamp: string | null;
}

export interface ElderlyItem {
  elderlyId: number;
  elderlyName: string;
  age: number;
  gender: number;
  roomNo: string;
  relation: string;
  familyName: string;
  latestRadarData: RadarDataSnapshot | null;
  statusTag: string;        // 正常 / 需关注
  statusLevel: 'normal' | 'warning' | 'danger';
  lastActivity: string;
}

export interface ElderlyDetail {
  elderlyId: number;
  name: string;
  age: number;
  gender: number;
  relation: string;
  roomNo: string;
  medicalHistory: string;
  emergencyContact: string;
  heartRate: number | null;
  breathRate: number | null;
  sleepHours: number | null;
  toiletCount: number | null;
  inoutCount: number | null;
  status: 'normal' | 'warning' | 'danger';
  lastActivity: string | null;
}

// 设备
export interface DeviceItem {
  id: number;
  deviceSn: string;
  deviceName: string;
  deviceCategory: string;
  onlineStatus: number;
  lastHeartbeat: string | null;
  batteryLevel: number | null;
  roomNo: string;
}

// 告警
export interface AlertItem {
  id: number;
  elderlyId: number | null;
  elderlyName: string;
  alertType: string;
  alertLevel: string;
  alertMessage: string;
  triggerValue: string;
  familyAcknowledged: number;
  familyAcknowledgedAt: string | null;
  handledStatus: number;
  createdAt: string;
}

export interface AlertRuleItem {
  id: number;
  ruleName: string;
  ruleType: string;
  ruleTypeLabel: string;
  severity: string;
  severityLabel: string;
  threshold: string;
}

// 报告
export interface DailyReport {
  date: string;
  avgHeartRate: number | null;
  avgBreathRate: number | null;
  sleepHours: number | null;
  toiletCount: number;
  inoutCount: number;
  fallCount: number;
  alertCount: number;
  aiSummary: string;
  dataCount: number;
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  days: DailyReport[];
  summary: {
    avgHeartRate: number;
    avgSleepHours: number;
    totalFallCount: number;
    totalAlertCount: number;
    totalToiletCount: number;
  };
  aiSummary: string;
}

export interface TrendPoint {
  hour: string;
  activityScore: number;
  heartRate: number | null;
}

// 通知
export interface NotificationSettings {
  wechat_enabled: boolean;
  alert_fall: boolean;
  alert_abnormal: boolean;
  daily_report: boolean;
  weekly_report: boolean;
}

// 分页
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
