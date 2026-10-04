# 05-Output — 输出产物存档

> AI Agent 各角色工作产出物的统一存放目录。

---

## 目录结构

```
05-Output/
├── README.md                  # 本文件
├── CEO/                       # 战略决策输出
│   └── decisions/             #   决策记录
├── CTO/                       # 技术架构输出
│   └── architecture/          #   架构设计文档
├── ProductManager/            # 产品输出
│   ├── prd/                   #   产品需求文档
│   └── roadmap/               #   路线图更新
├── SmartCareExpert/           # 养老业务输出
│   └── rules/                 #   业务规则文档
├── DataAnalyst/               # 数据分析输出
│   ├── metrics/               #   指标体系定义
│   └── alert-rules/           #   告警阈值规则
├── UIDesigner/                # UI设计输出
│   └── designs/               #   设计稿/原型
├── FrontendEngineer/          # 前端输出
│   ├── web/                   #   Web管理端迭代记录
│   └── miniapp/               #   小程序迭代记录
├── BackendEngineer/           # 后端输出
│   ├── api-design/            #   API设计文档
│   └── db-changes/            #   数据库变更记录
├── IoTEngineer/               # IoT输出
│   └── device-integration/    #   设备接入文档
├── ZabbixEngineer/            # Zabbix输出
│   └── monitoring/            #   监控配置文档
├── AIEngineer/                # AI输出
│   └── dify-workflows/        #   Dify工作流设计
├── QAEngineer/                # 测试输出
│   └── test-reports/          #   测试报告
└── DevOps/                    # 部署输出
    └── deploy-records/        #   部署记录
```

---

## 文件命名规范

```
{角色目录}/{产出类型}-{主题}-{日期}.md

示例：
- ProductManager/prd/PRD-跌倒告警推送-20260811.md
- BackendEngineer/api-design/API-老人详情接口-20260811.md
- FrontendEngineer/miniapp/迭代-绑定码删除功能-20260811.md
```

---

## 当前项目产物索引

### Web 管理端（已上线：https://anban.org.cn）

| 功能 | 状态 | 相关文件 |
|------|------|----------|
| 登录/认证 | 已完成 | Login.tsx, auth.py |
| Dashboard 概览大屏 | 已完成 | Dashboard.tsx, dashboard.py |
| 老人管理（列表+详情） | 已完成 | ElderlyList.tsx, ElderlyDetail.tsx |
| 告警中心 | 已完成 | AlertCenter.tsx, alerts.py |
| 告警规则管理 | 已完成 | AlertRules.tsx |
| 设备管理 | 已完成 | DeviceManagement.tsx, devices.py |
| 用户管理（管理员） | 已完成 | UserManagement.tsx, users.py |
| 家属绑定码管理 | 已完成 | BindManagement.tsx, family.py |

### 安伴 Guardian 小程序（开发中）

| 功能 | 状态 |
|------|------|
| 自动登录/注册 | 已完成（固定测试 openid） |
| 首页老人列表 | 已完成 |
| 老人详情（心率/呼吸/日报） | 基本完成（API路径已修复） |
| 告警列表/详情 | 已完成 |
| 绑定码绑定 | 已完成 |
| 微信订阅消息推送 | 待开发（P0） |
| wx.login 真实登录 | 待开发（P0） |
| 扫码绑定 | 待开发（P1） |

### 后端服务

| 服务 | 状态 |
|------|------|
| 8 个 API Router | 已完成 |
| JWT 认证 + 小程序认证 | 已完成 |
| 告警引擎（去重+分级+推送） | 已完成 |
| 健康日报（APScheduler） | 已完成 |
| 雷达数据采集器 | 已完成 |
| Zabbix 集成 | 可选，模板已就绪 |
| Dify AI 集成 | 可选，工作流设计完成 |

---

> **维护者**：SmartCare AI Studio Team
> **最后更新**：2026-08
