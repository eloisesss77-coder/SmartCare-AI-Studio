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
  alertType: string;       // fall/heart_rate/breath_rate/inactivity/offline
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

export interface HandleAlertRequest {
  handledStatus: number;
  handledBy: string;
  handleRemark?: string;
}

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
