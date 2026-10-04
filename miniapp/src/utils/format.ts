/** 工具函数 */

/** 格式化时间为相对时间描述 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const target = new Date(dateStr.replace(/-/g, '/')).getTime();
  const diff = Math.floor((now - target) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

/** 格式化日期 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr.replace(/-/g, '/'));
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 格式化时间 */
export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr.replace(/-/g, '/'));
  const h = String(dt.getHours()).padStart(2, '0');
  const m = String(dt.getMinutes()).padStart(2, '0');
  const s = String(dt.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** 告警类型中文 */
export function alertTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fall: '跌倒检测',
    heart_rate: '心率异常',
    breath_rate: '呼吸异常',
    inactivity: '久未活动',
    offline: '设备离线',
    manual_sos: '手动求救',
    smoke_alarm: '烟雾告警',
    gas_leak: '煤气泄漏',
    door_open_long: '门未关',
  };
  return map[type] || type;
}

/** 告警级别颜色 */
export function alertLevelColor(level: string): string {
  const map: Record<string, string> = {
    info: '#1890ff',
    warning: '#fa8c16',
    critical: '#ff7a45',
    emergency: '#f5222d',
  };
  return map[level] || '#999';
}

/** 告警级别中文 */
export function alertLevelLabel(level: string): string {
  const map: Record<string, string> = {
    info: '提示',
    warning: '一般',
    critical: '重要',
    emergency: '紧急',
  };
  return map[level] || level;
}

/** 体态中文 */
export function postureLabel(posture: string): string {
  const map: Record<string, string> = {
    standing: '站立',
    sitting: '坐姿',
    lying: '平躺',
    walking: '行走',
  };
  return map[posture] || posture || '未知';
}

/** 性别中文 */
export function genderLabel(g: number): string {
  if (g === 1) return '男';
  if (g === 2) return '女';
  return '未知';
}

/** 处理状态中文 */
export function handleStatusLabel(status: number): string {
  if (status === 0) return '未处理';
  if (status === 1) return '处理中';
  if (status === 2) return '已处理';
  return '';
}

/** 设备类型中文 */
export function deviceCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    radar_fall: '跌倒雷达',
    radar_bedside: '心率雷达',
    infrared: '红外探测器',
    door_magnet: '门磁',
    camera: '摄像头',
    sos_button: '呼叫按钮',
    smoke_detector: '烟雾报警',
    gas_detector: '煤气报警',
  };
  return map[cat] || cat;
}
