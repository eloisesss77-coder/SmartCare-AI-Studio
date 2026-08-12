# Zabbix Item 配置参考

> 本文件由 ZabbixEngineer 维护。
> 
> ⚠️ **重要说明**：Zabbix 在本项目中为可选组件。核心数据采集通过 `radar-collector` → FastAPI 后端 → MySQL（`t_radar_data` 表）的主通道完成，Zabbix Item 仅在机构已部署 Zabbix 体系时作为辅助监控通道使用。

## 与 FastAPI 后端的数据流关系

```
毫米波雷达设备
    │  MQTT (JSON 数据包)
    ▼
radar-collector (数据采集器)
    │  HTTP POST
    ▼
FastAPI 后端 (/api/v1/radar/data)
    │
    ├──→ MySQL (t_radar_data)  ← ★ 主数据通道，核心告警由后端独立处理
    │
    └──→ [可选] Zabbix Trapper  ← 辅助通道，仅在部署 Zabbix 时启用
         │  pyzabbix.ZabbixSender
         ▼
         Zabbix Server
           ├── Item (数据存储)
           ├── Trigger (告警判断)
           └── Action (通知推送)
```

> **关键结论**：FastAPI 后端的 `AlertRule` 表 + `AlertRecord` 表独立完成告警规则的判断和记录（无需 Zabbix）。Zabbix 的告警能力是可选的增强层，两者可并行工作。

## Item 类型

| 类型 | 说明 | SmartCare 使用场景 |
|------|------|-------------------|
| Zabbix Agent | 通过 Agent 采集 | 不需要（无服务器 Agent） |
| Zabbix Trapper | 外部推送 | **主要使用**：MQTT 网关推送设备数据 |
| HTTP Agent | HTTP 拉取 | 部分设备直接提供 HTTP API |
| Simple Check | 简单检查 | 网络连通性检查 |

## SmartCare Item Key 命名规范

```
格式：elder.{device_type}.{field_name}[{params}]

设备类型：
  radar       → 纳米雷达
  heart_rate  → 心率监测
  door        → 开关门传感器
  toilet      → 马桶传感器

示例：
  elder.radar.fall_status[E001]         → 老人 E001 跌倒状态
  elder.heart_rate.bpm[E001]            → 老人 E001 心率值
  elder.door.status[E001]               → 老人 E001 门状态
  elder.toilet.flush_count[E001]        → 老人 E001 马桶抽水次数
```

## 完整 Item 参数配置

| 参数 | 说明 | 建议值 |
|------|------|--------|
| Name | 可见名称 | `老人 {ELDER_NAME} 跌倒状态` |
| Type | 采集类型 | `Zabbix trapper` |
| Key | 唯一标识 | `elder.radar.fall_status[{ELDER_NAME}]` |
| Type of information | 数据类型 | `Numeric (unsigned)` |
| Update interval | 更新间隔 | `0`（Trapper 模式下由推送频率决定） |
| History storage | 历史数据保留 | `90d`（3 个月） |
| Trend storage | 趋势数据保留 | `365d`（1 年） |
| Value mapping | 值映射 | `0→正常, 1→跌倒, 2→疑似` |

## 设备 Item 清单

### 纳米雷达（Type: Trapper）

| Key | 说明 | 数据类型 | 单位 |
|-----|------|----------|------|
| `elder.radar.fall_status` | 跌倒状态 | Numeric (0-2) | — |
| `elder.radar.in_bed` | 在床状态 | Numeric (0-1) | — |
| `elder.radar.leave_bed_duration` | 离床时长 | Numeric | 秒 |
| `elder.radar.activity_level` | 活动量 | Numeric (0-100) | 分 |
| `elder.radar.battery_level` | 电量 | Numeric (0-100) | % |
| `elder.radar.device_online` | 设备在线 | Numeric (0-1) | — |

### 心率监测（Type: Trapper）

| Key | 说明 | 数据类型 | 单位 |
|-----|------|----------|------|
| `elder.heart_rate.bpm` | 实时心率 | Numeric | bpm |
| `elder.heart_rate.avg_5min` | 5分钟均值 | Numeric | bpm |
| `elder.heart_rate.device_online` | 设备在线 | Numeric (0-1) | — |
| `elder.heart_rate.battery` | 电量 | Numeric (0-100) | % |

### 开关门传感器（Type: Trapper）

| Key | 说明 | 数据类型 | 单位 |
|-----|------|----------|------|
| `elder.door.status` | 门状态 | Numeric (0-1) | — |
| `elder.door.open_count` | 开门次数 | Numeric | 次 |
| `elder.door.device_online` | 设备在线 | Numeric (0-1) | — |

### 马桶水流传感器（Type: Trapper）

| Key | 说明 | 数据类型 | 单位 |
|-----|------|----------|------|
| `elder.toilet.flush_count` | 抽水次数 | Numeric | 次/天 |
| `elder.toilet.last_flush_time` | 上次冲水时间 | Numeric | Unix时间戳 |
| `elder.toilet.device_online` | 设备在线 | Numeric (0-1) | — |

## Zabbix Trapper 配置

### Zabbix Server 端

```bash
# /etc/zabbix/zabbix_server.conf
StartTrappers=50          # 增加 Trapper 进程数（根据设备数量调整）
TrapperTimeout=300        # 超时 5 分钟
```

### 数据推送方式（Python）

```python
import paho.mqtt.client as mqtt
from pyzabbix import ZabbixSender

# MQTT 收到设备数据 → 转发到 Zabbix
def on_message(client, userdata, msg):
    data = json.loads(msg.payload)
    elder_id = data['elder_id']
    
    # 构建 Zabbix Trapper 数据包
    packet = [
        ZabbixSender.Metric(
            host=f'Elder-{elder_id}',
            key=f'elder.radar.fall_status[{elder_id}]',
            value=data['fall_status']
        )
    ]
    
    # 发送到 Zabbix Server
    sender = ZabbixSender('127.0.0.1', 10051)
    result = sender.send(packet)
```
