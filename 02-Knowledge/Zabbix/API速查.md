# Zabbix API 速查

> 本文件由 ZabbixEngineer 维护，供 BackendEngineer 调用 Zabbix API 时参考。

> ⚠️ **重要说明**：Zabbix 在 SmartCare AI Studio 中为**可选组件**。核心告警功能（跌倒检测、心率异常、设备离线等）由 FastAPI 后端独立处理（`app/routers/alerts.py`），不依赖 Zabbix。Zabbix 仅在需要专业运维监控（网络设备、服务器指标）或已部署 Zabbix 体系的机构中使用。

## 基础信息

- **API 地址**：`http://<zabbix-server>/api_jsonrpc.php`
- **认证方式**：Token-based（6.4+）/ 用户名密码
- **Header**：`Content-Type: application/json-rpc`

## 常用 API 方法

### 1. 认证

```json
{
  "jsonrpc": "2.0",
  "method": "user.login",
  "params": {
    "username": "Admin",
    "password": "zabbix"
  },
  "id": 1,
  "auth": null
}
```
返回：`{"jsonrpc":"2.0","result":"auth_token_string","id":1}`

### 2. 获取告警（Problem）

```json
{
  "jsonrpc": "2.0",
  "method": "problem.get",
  "params": {
    "output": ["eventid", "name", "severity", "clock", "objectid"],
    "hostids": ["12345"],
    "recent": true,
    "sortfield": "clock",
    "sortorder": "DESC",
    "limit": 50
  },
  "id": 2,
  "auth": "auth_token_string"
}
```

### 3. 获取 Item 历史数据

```json
{
  "jsonrpc": "2.0",
  "method": "history.get",
  "params": {
    "itemids": ["67890"],
    "history": 0,
    "time_from": 1749000000,
    "time_till": 1749086400,
    "sortfield": "clock",
    "sortorder": "ASC",
    "limit": 100
  },
  "id": 3,
  "auth": "auth_token_string"
}
```

### 4. 获取 Trend 趋势数据

```json
{
  "jsonrpc": "2.0",
  "method": "trend.get",
  "params": {
    "itemids": ["67890"],
    "time_from": 1746403200,
    "time_till": 1749086400,
    "limit": 30
  },
  "id": 4,
  "auth": "auth_token_string"
}
```

### 5. 确认告警（Acknowledge）

```json
{
  "jsonrpc": "2.0",
  "method": "event.acknowledge",
  "params": {
    "eventids": ["99999"],
    "message": "护理员已处理，老人状态正常",
    "action": 1
  },
  "id": 5,
  "auth": "auth_token_string"
}
```

### 6. 获取 Host 状态

```json
{
  "jsonrpc": "2.0",
  "method": "host.get",
  "params": {
    "output": ["hostid", "name", "status", "available", "lastaccess"],
    "filter": {
      "host": "Elder-Room-301"
    }
  },
  "id": 6,
  "auth": "auth_token_string"
}
```

## 告警严重程度（severity）

| 值 | 等级 | SmartCare 映射 |
|-----|------|---------------|
| 0 | Not classified | 🔵 提示 |
| 1 | Information | 🔵 提示 |
| 2 | Warning | 🟡 一般 |
| 3 | Average | 🟠 重要 |
| 4 | High | 🟠 重要 |
| 5 | Disaster | 🔴 紧急 |

## 本项目特有 Item Key 命名规范

当 Zabbix 集成 SmartCare 时，使用以下 Item Key 命名：

```
格式：smartcare.{device_type}.{metric}

设备类型：
  radar       → 毫米波雷达

示例：
  smartcare.radar.fall              → 跌倒状态（0=正常, 1=跌倒）
  smartcare.radar.heart_rate        → 心率（bpm）
  smartcare.radar.respiratory_rate  → 呼吸率（次/分）
  smartcare.radar.in_bed            → 在床状态（0=不在床, 1=在床）
  smartcare.radar.activity_level    → 活动量（0-3：静止/轻微/中等/剧烈）
  smartcare.radar.posture           → 姿态（0-3：躺/坐/站/走路）
  smartcare.radar.device_online     → 设备在线状态
  smartcare.radar.battery_level     → 电量（%）
```

## Zabbix API 调用最佳实践

1. 每次请求带 `auth` token，Token 过期需重新登录
2. API 调用必须设置超时（建议 ≤ 10s）
3. 批量查询时 `limit` 不超过 1000
4. 历史数据查询优先使用 `trend.get`（性能好），精确数据用 `history.get`
5. `host.get` 可替代设备在线状态查询
6. 本项目中 Zabbix 数据采集为**辅助通道**，核心数据由 FastAPI 直接写入 MySQL 的 `t_radar_data` 表
