# 工作流：全局协作流程

## 角色协作触发表

| 场景 | 发起方 | 接收方 | 依据文件 |
|------|--------|--------|----------|
| 新功能需求启动 | ProductManager → PRD | SmartCareExpert | PRD 文档 |
| 业务规则确认 | SmartCareExpert | ProductManager | 业务规范输出 |
| 告警规则定义 | DataAnalyst | BackendEngineer | AlertRule 表结构 |
| 设备数据格式 | IoTEngineer | BackendEngineer | RadarData Schema |
| API 接口设计 | BackendEngineer | FrontendEngineer | FastAPI /docs Swagger |
| Web 前端开发 | FrontendEngineer | ProductManager | UI 设计稿 + API 文档 |
| 小程序开发 | FrontendEngineer（兼任） | ProductManager | 小程序原型 + API 文档 |
| Zabbix 模板 | ZabbixEngineer | BackendEngineer | Template YAML + Webhook |
| Dify 工作流 | AIEngineer | BackendEngineer | Dify API 调用说明 |
| 知识库内容 | SmartCareExpert | AIEngineer | 知识条目文档 |
| 部署上线 | BackendEngineer | DevOps | docker-compose.yml |
| 代码审查 | 任意角色 | CodeReviewer | 代码差异 |

## 三端并行开发模式

安伴 Guardian 包含三个代码端，可以并行开发：

```
新功能需求
    │
    ├── BackendEngineer（后端）
    │   负责：/api/v1/* 路由、Pydantic Schema、数据库变更
    │   交付：可调用的 REST API + Swagger 文档
    │
    ├── FrontendEngineer（Web 管理端）
    │   负责：React + Ant Design 页面
    │   依赖：后端 API 就绪后联调
    │   交付：管理后台功能页面
    │
    └── FrontendEngineer（小程序端，可兼任）
        负责：Taro 小程序页面 + 组件
        依赖：后端 API + X-Family-Id 认证
        交付：家属端小程序功能
```

**并行条件**：API 接口定义先行（由 BackendEngineer 先输出 Schema 和接口文档），前后端可基于接口约定同时开发，后续联调。

## 典型场景：新功能开发流程

```
1. 需求阶段
   ProductManager 输出 PRD → SmartCareExpert 确认业务规范
       │
2. 设计阶段（可并行）
   ├── BackendEngineer：设计 API Schema + 数据库变更
   ├── UIDesigner：设计 UI 交互稿
   └── DataAnalyst：定义数据指标和告警规则（如涉及）
       │
3. 开发阶段（可并行）
   ├── BackendEngineer：实现 API + 数据库迁移
   ├── FrontendEngineer（Web）：实现管理后台页面
   └── FrontendEngineer（小程序）：实现家属端页面
       │
4. 联调阶段
   前后端联调 → 修复接口不一致 → UI 细节调整
       │
5. 测试阶段
   QAEngineer：功能测试 + 回归测试
       │
6. 部署阶段
   DevOps：docker compose restart backend + 前端 build → Nginx
```

## 增强组件触发流程（可选）

当需要 AI 或监控增强时，在上面的开发阶段介入：

```
Zabbix 监控增强：
  DataAnalyst 定义规则 → ZabbixEngineer 配置 Template + Webhook →
  BackendEngineer 配合对接 Webhook 端点

Dify AI 增强：
  ProductManager 定义 AI 需求 → SmartCareExpert 准备知识 →
  AIEngineer 设计工作流 → BackendEngineer 集成 Dify API 到 wechat_service / daily_report
```

## 当前项目状态

| 模块 | 状态 | 说明 |
|------|------|------|
| FastAPI 后端 | ✅ 已上线 | 所有核心 API 运行中，部署在 https://anban.org.cn |
| Web 管理端 | ✅ 已上线 | React + Ant Design，10 个页面，Nginx 代理 |
| 小程序（家属端） | 🔧 MVP 完成 | Taro 构建，3 个 Tab 6 个页面，正完善核心体验 |
| Zabbix 监控 | ⏳ 可选组件 | 模板与脚本就绪，待按需启用 |
| Dify AI | ⏳ 可选组件 | 工作流设计就绪，待后端集成 |
| Docker 部署 | ✅ 运行中 | docker-compose 编排，后端容器 + 宿主机 Nginx |

## 连续优化闭环

```
上线后 DataAnalyst 持续分析：
  ├── 告警准确率（减少误报）
  ├── 告警响应时长（目标 < 5 分钟）
  ├── 小程序用户活跃度
  └── 输出优化建议 → ProductManager 排期 → 开发迭代
```
