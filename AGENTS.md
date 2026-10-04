# AGENTS.md — SmartCare AI Studio 项目指南

> **给 AI Agent 的项目说明书**。本文档描述项目架构、约定和上下文，确保所有 Agent（编码、审查、调试、安全）在同一基准上协作。

---

## 一、项目概述

**SmartCare AI Studio** 是基于 IoT + AI 的智慧养老监控平台。

- **产品名**：安伴 Guardian
- **核心能力**：毫米波雷达跌倒检测 → 实时告警 → 家属小程序 + 管理后台
- **线上地址**：https://anban.org.cn（Web 端） + 安伴 Guardian 小程序
- **代码仓库**：`d:\网训科技\SmartCare-AI-Studio`

---

## 二、目录结构

```
SmartCare-AI-Studio/
├── AGENTS.md                          # ← 本文件（AI 协作基准文档）
├── README.md                          # 项目总 README
├── 00-Company/                        # 公司级规范（愿景、技术栈、路线图）
├── 01-Agents/                         # 14 个 AI 角色定义 (CEO/CTO/PM/...)
├── 02-Knowledge/                      # 领域知识库 (养老政策、Zabbix、Dify)
├── 03-Projects/
│   └── smartcare-monitor/             # ★ 主项目代码
│       ├── backend/                   #    Python FastAPI 后端
│       ├── frontend/                  #    React + Ant Design Web 管理端
│       ├── miniapp/                   #    Taro 微信小程序（家属端）
│       ├── radar-collector/           #    雷达数据采集器（MQTT → 后端）
│       ├── zabbix/                    #    Zabbix 监控集成
│       ├── scripts/                   #    运维/开发脚本
│       ├── sql/                       #    MySQL 初始化 SQL
│       ├── docker-compose.yml         #    Docker 编排
│       └── DEPLOY.md                  #    部署指南
├── 04-Templates/                      # 代码模板
└── 05-Output/                         # 输出产物
```

---

## 三、技术栈

| 层 | 技术 | 版本/说明 |
|----|------|-----------|
| **后端框架** | FastAPI | 0.115.0 + Uvicorn 0.30 |
| **ORM** | SQLAlchemy | 2.0.35 |
| **数据库** | MySQL | 8.0（生产） / SQLite（本地开发） |
| **认证** | PyJWT (HS256) | Token 有效期 120 分钟 |
| **定时任务** | APScheduler | 3.10.4 |
| **前端框架** | React 18 + TypeScript 5.5 |
| **构建工具** | Vite | 5.4 |
| **UI 库** | Ant Design | 5.20 |
| **图表** | ECharts | 5.5 + echarts-for-react |
| **小程序** | Taro 3.6 | React + Webpack 5，目标 weapp |
| **容器化** | Docker + Docker Compose |
| **反向代理** | Nginx | 宿主机监听 80 |

---

## 四、数据库模型（12 张表）

所有表前缀 `t_`：

| 模型 | 表名 | 说明 |
|------|------|------|
| `Elderly` | `t_elderly` | 老人信息（姓名、年龄、房间、绑定雷达设备） |
| `RadarDevice` | `t_radar_device` | 雷达设备（序列号、房间、MQTT 主题、在线状态） |
| `RadarData` | `t_radar_data` | 雷达实时数据（心率、呼吸、跌倒、在床、姿态） |
| `AlertRule` | `t_alert_rule` | 告警规则（阈值 JSON、严重级、通知渠道） |
| `AlertRecord` | `t_alert_record` | 告警记录（类型、级别、处理状态、关联 elder） |
| `DashboardStats` | `t_dashboard_stats` | 仪表盘统计快照 |
| `User` | `t_user` | 管理端用户（admin/caregiver/super_admin） |
| `Family` | `t_family` | C端家属账号（openid/unionid 驱动） |
| `FamilyElderly` | `t_family_elderly` | 家属-老人绑定关系 |
| `BindCode` | `t_bind_code` | 家属绑定码（6位，24小时过期） |
| `CaregiverElderly` | `t_caregiver_elderly` | 护理员-老人分配 |
| `DeviceGeneric` | `t_device_generic` | 通用设备（SOS、烟感、门磁等） |

**字段命名**：数据库用 snake_case，API 返回 camelCase（通过 Pydantic `alias_generator=to_camel` 自动转换）。

---

## 五、后端 API 路由

| Router | Prefix | 关键端点 |
|--------|--------|----------|
| `elderly` | `/api/v1/elderly` | CRUD 老人、绑定雷达、雷达数据、健康日报 |
| `radar` | `/api/v1/radar` | 雷达数据接收、设备列表、历史查询 |
| `alerts` | `/api/v1/alerts` | 告警接收（无认证）、列表、处理、规则 CRUD |
| `dashboard` | `/api/v1/dashboard` | 概览统计、告警趋势、设备状态 |
| `auth` | `/api/v1/auth` | 登录、个人信息、修改密码 |
| `users` | `/api/v1/users` | 用户管理（管理员权限） |
| `family` | `/api/v1/family` | 家属注册、绑定码、老人列表、解绑 |
| `devices` | `/api/v1/devices` | 设备管理、分类、指令下发 |

**认证**：除 `/auth/login` 和告警 webhook 外，所有接口需要 `Authorization: Bearer {token}`。

**小程序认证**：C端接口使用 Header `X-Family-Id` 标识家属身份（不校验 JWT）。

**路由层级注意**：
- 老人详情相关接口在 `/api/v1/elderly/` 下，**不在** `/api/v1/family/` 下
- 家属查询老人用 `/api/v1/family/my-elderly`（返回绑定的老人列表+最新雷达数据）

---

## 六、前端项目结构

```
frontend/src/
├── App.tsx                 # 路由配置 + ProtectedRoute/AdminRoute 守卫
├── config/index.ts         # API_BASE_URL, WS_URL
├── contexts/AuthContext.tsx # Token/User 状态管理
├── services/api.ts         # Axios 封装，所有接口调用
├── types/index.ts          # TS 类型定义
├── components/             # 7 个共享组件
│   ├── Layout.tsx          # 主布局 (Sider + Header)
│   ├── ErrorBoundary.tsx
│   ├── AlertBadge.tsx
│   ├── ElderlyStatusCard.tsx
│   ├── HeartRateChart.tsx
│   ├── RadarStatusCard.tsx
│   └── RealTimeMonitor.tsx
└── pages/                  # 10 个页面
    ├── Dashboard.tsx       # 首页概览大屏
    ├── ElderlyList.tsx     # 老人列表
    ├── ElderlyDetail.tsx   # 老人详情
    ├── AlertCenter.tsx     # 告警中心
    ├── AlertRules.tsx      # 告警规则
    ├── DeviceManagement.tsx # 设备管理
    ├── BindManagement.tsx  # 家属绑定码
    ├── UserManagement.tsx  # 用户管理 (admin only)
    ├── Login.tsx           # 登录
    └── NotFound.tsx        # 404
```

**路由规则**：
| 路径 | 页面 | 权限 |
|------|------|------|
| `/login` | Login | 公开 |
| `/` | Dashboard | 需认证 |
| `/elderly` | ElderlyList | 需认证 |
| `/elderly/:id` | ElderlyDetail | 需认证 |
| `/alerts` | AlertCenter | 需认证 |
| `/alert-rules` | AlertRules | 需认证 |
| `/devices` | DeviceManagement | 需认证 |
| `/bind` | BindManagement | 需认证 |
| `/users` | UserManagement | 管理员 |

---

## 七、小程序项目结构

```
miniapp/src/
├── app.tsx                 # 入口：useLaunch 自动登录
├── app.config.ts           # 路由 + 3 个 Tab 配置
├── components/             # 3 个组件
│   ├── alert-banner/       # 告警横幅
│   ├── elderly-card/       # 老人卡片
│   └── vital-panel/        # 生命体征面板
├── pages/                  # 6 个页面
│   ├── index/              # 首页（老人卡片列表 + 绑定入口）
│   ├── elderly-detail/     # 老人详情（心率/呼吸/日报/10s轮询）
│   ├── alert-list/         # 告警列表
│   ├── alert-detail/       # 告警详情
│   ├── bind/               # 绑定码绑定
│   └── mine/               # 我的（个人中心）
├── services/api.ts         # Taro.request 封装
├── types/index.ts          # 类型定义
└── utils/format.ts         # 格式化工具
```

**Tab 配置（3 个底部导航）**：

| Tab | 路径 | 标题 |
|-----|------|------|
| 首页 | `pages/index/index` | 首页 |
| 告警 | `pages/alert-list/alert-list` | 告警 |
| 我的 | `pages/mine/mine` | 我的 |

**登录流**：
1. 小程序启动 → `useLaunch` → `doLogin()`
2. 当前使用固定测试 openid `test_openid_001`（上线前需改为 `wx.login()` 获取 code）
3. POST `/api/v1/family/register` 注册/登录
4. 存入 `familyId` 到 Storage，设置 `loginReady` 通知 API 层

**API 调用约定**：
- 所有带认证的请求自动附加 Header `X-Family-Id`
- 登录完成前（`ensureAuth`）暂停所有 API 调用
- `BASE_URL = 'https://anban.org.cn/api/v1'`（生产）/ 本地调试改 `localhost`

---

## 八、部署架构

```
                       ┌─────────────────┐
                       │   Nginx :80     │
                       │   (宿主机)       │
                       │                 │
                       │ / → frontend    │
                       │ /api/ → :8000   │
                       │ /ws/  → :8000   │
                       └───┬─────────┬───┘
                           │         │
              ┌────────────▼──┐   ┌──▼──────────────┐
              │ Docker 容器    │   │ Zabbix :8080    │
              │ Uvicorn :8000  │   └─────────────────┘
              │ FastAPI 后端   │
              └───────┬───────┘
                      │ 127.0.0.1
              ┌───────▼───────┐
              │  MySQL :3306  │
              └───────────────┘
```

**端口规划**：
| 端口 | 用途 | 公网 |
|------|------|------|
| 80 | Web 前端 + API | 是 |
| 8000 | FastAPI | 否（仅 127.0.0.1） |
| 8080 | Zabbix UI | 是 |
| 3306 | MySQL | 否（仅 127.0.0.1） |

**部署更新流程**（在服务器上执行）：
```bash
cd /opt/SmartCare-AI-Studio && git pull
# 后端：重启容器
docker compose restart backend
# 前端：重新 build + 覆盖 dist
cd frontend && npm run build
cp -r dist/* /usr/share/nginx/html/ && nginx -s reload
```

---

## 九、编码约定

### 通用
- **语言**：代码注释和日志用中文，变量/函数名用英文 camelCase
- **字段命名**：数据库 snake_case，API camelCase（Pydantic alias 自动转换）
- **错误处理**：后端统一返回 `ApiResponse` 结构 `{ code, message, data }`
- **不要提交**：`.env`、`node_modules/`、`.vite/`
- **行尾**：Windows 本地 CRLF，Git 自动转 LF

### 后端 (Python/FastAPI)
- 路由文件放在 `app/routers/`，每个模块一个文件
- 路由 handler 中 `user: User = Depends(get_current_user)` 获取当前用户
- 日志使用 `logging.getLogger(__name__)`
- 数据库 Session 通过 `Depends(get_db)` 注入，事务自动 commit/rollback
- Schemas 中响应模型使用 `alias_generator=to_camel`，接收模型保持 snake_case

### 前端 (React/TypeScript)
- API 调用统一走 `src/services/api.ts` 的 Axios 实例
- 页面组件放在 `src/pages/`，共享组件放 `src/components/`
- 认证状态通过 `AuthContext` 管理，路由守卫用 `ProtectedRoute` / `AdminRoute`
- Ant Design 组件优先，自定义样式写在同目录 `.css` 文件
- 使用 `App.useApp()` 获取 `message`/`notification` API

### 小程序 (Taro/React)
- API 调用统一走 `src/services/api.ts` 的 `request()` 封装
- 小程序页面路径在 `app.config.ts` 中注册
- 使用 Taro API（`Taro.navigateTo`、`Taro.getStorageSync` 等），不用 Web API

---

## 十、常用命令

```bash
# === 后端 ===
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# === 前端 ===
cd frontend
npm install
npm run dev          # 开发服务器 :3000，自动代理 /api → :8000
npm run build        # 生产构建

# === 小程序 ===
cd miniapp
npm install
npm run dev:weapp    # Taro 开发模式（微信开发者工具打开 dist/）

# === Docker ===
docker compose up -d --build        # 构建并启动
docker compose restart backend      # 重启后端（拉取代码后）
docker compose logs -f backend      # 查看后端日志

# === Git ===
git add -A && git commit -m "message" && git push origin master
```

---

## 十一、已知问题 & 待办

| 优先级 | 问题 | 状态 |
|--------|------|------|
| P0 | 小程序需接入微信订阅消息推送 | 待开发 |
| P0 | 小程序 wx.login 替换固定 openid | 待开发 |
| P1 | 小程序绑定码改为扫码绑定 | 待开发 |
| P1 | 详情页健康数据趋势图 | 待开发 |
| P2 | Web端 Nginx 缓存 index.html 导致部署后不更新 | 需加 no-cache 头 |
| P2 | 前端告警趋势时间窗口需调大 | 已修复 |

---

> **最后更新**：2026-08-11
> **维护者**：SmartCare AI Studio Team
