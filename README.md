# SmartCare AI Studio

> **安伴 Guardian — 智慧养老 AI 研发工作室**

基于 IoT 毫米波雷达 + AI 的智慧养老监控平台。一个人 = 一家 AI 软件公司，由 AI Agent 驱动的全栈研发体系。

---

## 产品简介

**安伴 Guardian** 是一款面向养老机构和家属的智慧养老监控产品：

- **核心技术**：毫米波雷达非侵入式监测（跌倒检测、心率/呼吸、在床/离床、活动姿态）
- **多端覆盖**：Web 管理后台 + 微信小程序（家属端）+ 大屏监控
- **实时告警**：跌倒/心率异常/离床超时 → 多级告警 → 微信/钉钉/企微推送
- **上线状态**：[https://anban.org.cn](https://anban.org.cn) 已上线

```
毫米波雷达 → MQTT → FastAPI 后端 → MySQL
                         ↓
                   告警引擎 → 微信订阅消息
                         ↓
              ┌──────────┼──────────┐
              ↓                     ↓
       Web 管理后台          安伴 Guardian 小程序
    (React + Ant Design)      (Taro + React)
```

---

## 项目架构

```
SmartCare-AI-Studio/
├── AGENTS.md                  # AI Agent 项目说明书（协作基准）
├── README.md                  # 本文件
├── 00-Company/                # 公司级规范（愿景、技术栈、路线图、编码规范）
├── 01-Agents/                 # AI 团队成员（11 个角色 + 全局流程）
├── 02-Knowledge/              # 领域知识库（养老政策、Dify）
├── 03-Projects/
│   └── smartcare-monitor/     # ★ 主项目
│       ├── backend/           #   FastAPI 后端（Python）
│       ├── frontend/          #   Web 管理端（React）
│       ├── miniapp/           #   安伴 Guardian 小程序（Taro）
│       ├── radar-collector/   #   雷达数据采集器
│       ├── scripts/           #   运维脚本 + 测试数据
│       └── sql/               #   数据库初始化
├── 04-Templates/              # 代码模板（FastAPI/React/MySQL）
└── 05-Output/                 # 产出物存档
```

---

## 技术栈（当前实际）

| 层 | 技术 |
|----|------|
| **后端** | Python FastAPI 0.115 + SQLAlchemy 2.0 + PyMySQL |
| **数据库** | MySQL 8.0（生产） / SQLite（本地开发） |
| **认证** | JWT (HS256) + X-Family-Id（小程序） |
| **前端** | React 18 + TypeScript + Ant Design 5 + ECharts 5 + Vite 5 |
| **小程序** | Taro 3.6 (React) → 微信小程序 |
| **数据采集** | Python MQTT Client → FastAPI |
| **告警推送** | 微信订阅消息 / 钉钉 Webhook / 企微 Webhook |
| **部署** | Docker Compose + Nginx + Ubuntu 22.04 |
| **监控集成** | Zabbix 6.4 LTS（可选）|
| **AI 增强** | Dify 工作流（可选） |

---

## 数据库模型（12 张表，前缀 t_）

| 表 | 用途 |
|----|------|
| `t_elderly` | 老人基本信息 |
| `t_radar_device` | 雷达设备注册 |
| `t_radar_data` | 雷达实时数据（时序） |
| `t_alert_rule` | 告警规则配置 |
| `t_alert_record` | 告警记录 |
| `t_dashboard_stats` | 仪表盘统计 |
| `t_user` | 管理端用户（admin/operator/viewer） |
| `t_family` | C端家属账号 |
| `t_family_elderly` | 家属-老人绑定 |
| `t_bind_code` | 家属绑定码（6位，24h过期） |
| `t_caregiver_elderly` | 护理员-老人分配 |
| `t_device_generic` | 通用设备（SOS/烟感/门磁等） |

---

## AI Agent 团队

| 角色 | 职责 |
|------|------|
| **CEO** | 战略决策、优先级裁定 |
| **CTO** | 技术架构、选型评审 |
| **ProductManager** | PRD 输出、需求管理 |
| **SmartCareExpert** | 养老行业规范 |
| **DataAnalyst** | 指标体系、告警规则 |
| **UIDesigner** | UI/UX 设计 |
| **FrontendEngineer** | React Web + 小程序前端 |
| **BackendEngineer** | FastAPI 后端 |
| **IoTEngineer** | 雷达/传感器接入 |
| **ZabbixEngineer** | 监控平台配置 |
| **AIEngineer** | Dify 工作流编排 |

---

## 快速开始

```bash
# 1. 阅读项目说明书
cat AGENTS.md

# 2. 后端启动
cd 03-Projects/smartcare-monitor/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. 前端启动
cd 03-Projects/smartcare-monitor/frontend
npm install && npm run dev    # http://localhost:3000

# 4. 小程序启动
cd 03-Projects/smartcare-monitor/miniapp
npm install && npm run dev:weapp   # 微信开发者工具打开 dist/

# 5. Docker 部署
cd 03-Projects/smartcare-monitor
docker compose up -d --build
```

---

## 部署

详细部署指南：[DEPLOY.md](03-Projects/smartcare-monitor/DEPLOY.md)

- 生产环境：Ubuntu 22.04 + Docker + Nginx + MySQL
- 线上地址：[https://anban.org.cn](https://anban.org.cn)
- API 基础 URL：`https://anban.org.cn/api/v1`

---

> **维护者**：SmartCare AI Studio Team
> **最后更新**：2026-08
