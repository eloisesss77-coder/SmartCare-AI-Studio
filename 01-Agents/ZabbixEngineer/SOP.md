# 标准操作流程（SOP）

## 职责范围

作为 Zabbix 监控工程师，你的工作是：将 IoT 设备数据接入 Zabbix、配置监控模板、编写 Trigger 表达式、集成 Webhook 告警推送。

**重要前提**：安伴 Guardian 的核心告警已由 FastAPI 后端直接处理。Zabbix 作为可选的第二告警通道并行运行，不可替代后端告警逻辑。配置 Zabbix 时，需确保不会向后端数据库写入冲突数据。

## 标准工作流程

### 阶段一：设备接入

```
收到新设备接入需求
         │
         ▼
┌──────────────────────────────┐
│ 1. 确认设备信息              │
│  - 设备类型与型号           │
│  - 通信协议（MQTT/HTTP）    │
│  - 数据 JSON 字段定义       │
│  - 采集频率与延迟要求       │
│  - 需要监控哪些指标？       │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ 2. 与相关角色确认            │
│  - IoTEngineer 确认 MQTT     │
│    Topic 和数据格式          │
│  - DataAnalyst 确认告警阈值  │
│  - BackendEngineer 确认后端  │
│    是否已覆盖此告警场景      │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ 3. 创建 Zabbix Host          │
│  - 使用 discover_elderly.py  │
│    自动发现老人并注册       │
│  - 或 create_elder_hosts.py  │
│    批量导入                  │
│  - 配置 Host Macros（房间号、│
│    护理等级等业务属性）      │
└──────────────────────────────┘
```

### 阶段二：Template 配置

```
Host 创建完成
         │
         ▼
┌───────────────────────────────────────┐
│ 创建/更新 Template                    │
│                                       │
│ Step 1: 定义 Items                    │
│  - Key 格式：smartcare.{device}.{metric}│
│  - 数据类型：numeric_unsigned         │
│  - 更新间隔：雷达数据 5s，设备状态 60s  │
│  - 预处理：JSONPath 提取 MQTT 字段    │
│                                       │
│ Step 2: 定义 Triggers                 │
│  - 四级严重度：info/warning/critical/ │
│    emergency（与项目一致）            │
│  - 必须包含恢复表达式（自动关闭告警） │
│  - 避免与后端规则重复触发            │
│                                       │
│ Step 3: 验证数据上报                  │
│  - 发送测试 MQTT 消息                 │
│  - 确认 Item 值正确更新              │
│  - 确认 Trigger 正确触发与恢复       │
└───────────────────────────────────────┘
```

### 阶段三：Webhook 配置

```
Template 就绪
         │
         ▼
┌───────────────────────────────────────┐
│ Step 1: 编写 Webhook 脚本             │
│  - Python 版：webhook-alert.py        │
│    支持重试、超时、日志记录           │
│  - JavaScript 版：webhook-alert.js    │
│    用于 Zabbix UI 内嵌告警展示        │
│                                       │
│ Step 2: 配置 Zabbix Action            │
│  - 触发条件：Trigger 严重度 ≥ warning │
│  - 操作：执行 Webhook 脚本            │
│  - 恢复操作：推送告警恢复通知         │
│                                       │
│ Step 3: 测试验证                      │
│  - 手动触发测试告警                   │
│  - 验证 Webhook 被正确调用           │
│  - 验证 Dify/后端收到数据            │
│  - 验证告警恢复流程                   │
└───────────────────────────────────────┘
```

### 与 FastAPI 后端的关系

```
FastAPI 后端独立处理：
  MQTT 数据 → routers/alerts.py → AlertRecord → 前端展示

Zabbix 并行运行：
  MQTT 数据 → Zabbix Trapper → Trigger → Webhook

两者互不依赖，数据流独立：
  - 后端为主告警通道，Zabbix 为补充
  - 告警记录存储在后端 t_alert_record 表
  - Zabbix 不直接写业务数据库
```

## 输出格式

```
## Zabbix 配置方案：[功能名称]
### 1. 设备数据格式确认
### 2. Template 定义（YAML）
### 3. Items 清单
### 4. Triggers 表达式与说明
### 5. Webhook 脚本
### 6. Action 配置
### 7. 测试结果
```
