# Zabbix Trigger 表达式语法

> 本文件由 ZabbixEngineer 维护。

## 基础函数

### 最常用函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `last()` | 最新值 | `last(/Host/item.key)` |
| `min(n)` | 最近 n 次最小值 | `min(/Host/item.key,#5)` |
| `max(n)` | 最近 n 次最大值 | `max(/Host/item.key,#5)` |
| `avg(n)` | 最近 n 次平均值 | `avg(/Host/item.key,#5)` |
| `count(t,eq,v)` | 时间 t 内等于 v 的次数 | `count(/Host/item.key,30m,eq,1)` |
| `nodata(t)` | t 时间内无数据 | `nodata(/Host/item.key,30m)`=1 |
| `time()` | 当前时间（秒） | `time(0)` 即 00:00 |
| `date()` | 当前日期 | 周几 |

### 时间参数格式

```
30s  = 30 秒
5m   = 5 分钟
2h   = 2 小时
1d   = 1 天
1w   = 1 周
```

## SmartCare 常用 Trigger 表达式

### 跌倒检测

```
{#FALL_STATUS}=1
说明：雷达检测到跌倒，立即告警

{#FALL_STATUS}=2 and last(/{HOST}/elder.radar.in_bed)=0
说明：疑似跌倒+离床状态，需关注
```

### 心率异常

```
last(/{HOST}/elder.heart_rate.bpm)>150 and last(/{HOST}/elder.heart_rate.bpm,#3)>150
说明：心率危险偏高，持续 3 个采样周期

last(/{HOST}/elder.heart_rate.bpm)<40 and last(/{HOST}/elder.heart_rate.bpm,#3)<40
说明：心率危险偏低，持续 3 个采样周期

last(/{HOST}/elder.heart_rate.bpm)>120 and last(/{HOST}/elder.heart_rate.bpm,#3)>120
说明：心率偏高，需关注

last(/{HOST}/elder.heart_rate.bpm)<50 and last(/{HOST}/elder.heart_rate.bpm,#3)<50
说明：心率偏低，需关注
```

### 离床监测

```
last(/{HOST}/elder.radar.leave_bed_duration)>1800 and time()>=21600 and time()<=72000
说明：日间（06:00-20:00）离床超过 30 分钟

last(/{HOST}/elder.radar.leave_bed_duration)>900 and (time()<21600 or time()>72000)
说明：夜间（20:00-06:00）离床超过 15 分钟
```

### 开关门异常

```
last(/{HOST}/elder.door.status)=1 and time()<21600 and count(/{HOST}/elder.door.status,30m,eq,1)>3
说明：凌晨频繁开门超过 3 次
```

### 马桶异常

```
last(/{HOST}/elder.toilet.flush_count)>10
说明：马桶使用超过 10 次（日累计）

last(/{HOST}/elder.toilet.flush_count,1d)<2
说明：马桶使用少于 2 次（日累计）
```

### 设备离线

```
nodata(/{HOST}/elder.radar.fall_status,30m)=1
说明：雷达 30 分钟无数据上报，判定离线

nodata(/{HOST}/elder.heart_rate.bpm,15m)=1
说明：心率设备 15 分钟无数据上报
```

### 电量低

```
last(/{HOST}/elder.radar.battery_level)<10
说明：雷达电量低于 10%
```

## Trigger 依赖关系

```
🔴 跌倒告警 (Disaster)
  └── 依赖：无需依赖（独立告警）

🟠 心率危险偏高 (High)  
  └── 依赖：🔴 跌倒告警 → 跌倒时抑制心率告警（避免重复告警）

🟡 日间离床过长 (Warning)
  └── 依赖：🟠 心率异常 → 心率异常时离床告警降至提醒
```

## 恢复表达式

每个 Trigger 应配置自动恢复条件：

```
跌倒恢复：
last(/{HOST}/elder.radar.fall_status)=0 and last(/{HOST}/elder.radar.in_bed)=1

心率恢复：
last(/{HOST}/elder.heart_rate.bpm)>50 and last(/{HOST}/elder.heart_rate.bpm)<100
```

## 与项目 AlertRule 表 threshold_value 的映射关系

安伴 Guardian 的告警规则由 `t_alert_rule` 表的 `threshold_value` JSON 字段驱动。Zabbix Trigger 表达式可与之对应：

| AlertRule 示例 | threshold_value JSON | 对应的 Zabbix Trigger 表达式 |
|---------------|---------------------|---------------------------|
| 跌倒告警 | `{"fall_status": 1}` | `last(/{HOST}/smartcare.radar.fall)=1` |
| 心率过高 | `{"heart_rate": 150, "duration": 3}` | `last(/{HOST}/smartcare.radar.heart_rate)>150 and last(/{HOST}/smartcare.radar.heart_rate,#3)>150` |
| 心率过低 | `{"heart_rate": 40, "duration": 3}` | `last(/{HOST}/smartcare.radar.heart_rate)<40 and last(/{HOST}/smartcare.radar.heart_rate,#3)<40` |
| 呼吸过快 | `{"respiratory_rate": 30}` | `last(/{HOST}/smartcare.radar.respiratory_rate)>30` |
| 呼吸过慢 | `{"respiratory_rate": 10}` | `last(/{HOST}/smartcare.radar.respiratory_rate)<10` |
| 日间离床过长 | `{"leave_bed_duration": 1800}` | `last(/{HOST}/smartcare.radar.leave_bed_duration)>1800 and time()>=21600 and time()<=72000` |
| 夜间离床过长 | `{"leave_bed_duration": 900}` | `last(/{HOST}/smartcare.radar.leave_bed_duration)>900 and (time()<21600 or time()>72000)` |
| 设备离线 | `{"no_data_duration": 1800}` | `nodata(/{HOST}/smartcare.radar.fall,30m)=1` |

### AlertRule 表结构与 Trigger 对应

| AlertRule 字段 | 说明 | Zabbix 对应 |
|---------------|------|------------|
| `threshold_value` (JSON) | 告警阈值配置 | Trigger 表达式 |
| `severity` | 告警级别 (info/warning/critical/emergency) | Trigger severity (Information/Warning/High/Disaster) |
| `is_enabled` | 是否启用 | Trigger enabled/disabled |
| `rule_category` | 告警分类 (fall/heart/breath/bed/device) | Item key 前缀 |
| `remark` | 规则备注 | Trigger name |

> **设计哲学**：FastAPI 后端独立于 Zabbix 运行告警逻辑。当启用 Zabbix 时，`threshold_value` JSON 中的值可作为 Zabbix Trigger 表达式的直接参数，确保两端告警逻辑一致。
