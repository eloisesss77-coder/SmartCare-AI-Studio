# SmartCare 公司级协作工作流

> 本文档定义从需求到上线的完整协作流程，与 [01-Agents/Workflow-Global.md](../01-Agents/Workflow-Global.md) 互补。
> 本文档侧重流程节点和交付物管理，Workflow-Global.md 侧重角色间交互细节。

## 研发流程总览

```
Phase 0: 需求决策
  │  CEO → ProductManager
  │  产出：优先级决策
  ▼
Phase 1: 需求分析
  │  ProductManager → PRD
  │  SmartCareExpert → 业务规范
  │  产出：PRD + 业务规范
  ▼
Phase 2: 数据建模
  │  DataAnalyst → 指标体系 + 告警规则
  │  产出：数据模型 + 告警规则文档
  ▼
Phase 3: 并行开发
  │  ┌─ UIDesigner → 设计方案
  │  ├─ IoTEngineer → 设备接入
  │  └─ ZabbixEngineer → 监控配置
  │  产出：设计方案 + MQTT文档 + Zabbix Template
  ▼
Phase 4: AI 集成
  │  AIEngineer → Dify 工作流
  │  产出：Dify 工作流 + Prompt 模板
  ▼
Phase 5: 后端开发
  │  BackendEngineer → API + 数据库
  │  产出：API 文档 + DDL + 代码
  ▼
Phase 6: 前端开发
  │  FrontendEngineer → 页面 + 组件
  │  产出：前端代码
  ▼
Phase 7: 测试
  │  QAEngineer → 测试计划 + 测试报告
  │  产出：测试报告
  ▼
Phase 8: 上线
  │  DevOps → 部署
  │  CEO → 审批
  │  产出：上线确认
  ▼
Phase 9: 持续优化
  │  DataAnalyst → 分析 → 优化建议
  │  产出：优化报告 → 循环回 Phase 0
  └──────────────────────────────
```

## 各 Phase 详细说明

### Phase 0：需求决策

| 项目 | 说明 |
|------|------|
| **触发** | 用户反馈 / 市场分析 / Roadmap 迭代 |
| **决策者** | CEO |
| **输入** | 需求描述 |
| **输出** | 优先级（P0/P1/P2/P3）、下一步行动 |
| **交付物** | 决策记录 |
| **时间** | 1-2 小时（AI 对话） |

### Phase 1：需求分析

| 项目 | 说明 |
|------|------|
| **执行者** | ProductManager（主导）、SmartCareExpert（审核） |
| **输入** | CEO 决策 |
| **输出** | PRD + 业务规范 |
| **交付物** | `05-Output/ProductManager/PRD-{功能名}-v1.0.md` |
| **验收标准** | PRD 中 8 个模块完整，SmartCareExpert 审核通过 |
| **时间** | 2-4 小时（AI 对话） |

### Phase 2：数据建模

| 项目 | 说明 |
|------|------|
| **执行者** | DataAnalyst |
| **输入** | PRD + 业务规范 |
| **输出** | 指标体系 + 告警规则 + 数据模型 |
| **交付物** | `05-Output/DataAnalyst/分析-{功能名}-v1.0.md` |
| **验收标准** | 每条告警规则有明确的触发条件、等级、数据来源 |
| **时间** | 1-2 小时 |

### Phase 3：并行开发

| 角色 | 产出 | 交付物位置 |
|------|------|-----------|
| UIDesigner | 设计方案 | `05-Output/UIDesigner/` |
| IoTEngineer | 设备接入方案 | `05-Output/IoTEngineer/` |
| ZabbixEngineer | 监控配置方案 | `05-Output/ZabbixEngineer/` |

### Phase 4：AI 集成

| 项目 | 说明 |
|------|------|
| **执行者** | AIEngineer |
| **输入** | 告警规则（DataAnalyst）+ 监控方案（ZabbixEngineer） |
| **输出** | Dify 工作流配置 + Prompt 模板 |
| **交付物** | `05-Output/AIEngineer/` + `03-Projects/SmartCareAI/` |

### Phase 5-6：前后端开发

```
BackendEngineer：先于 FrontendEngineer 开始
  → API 定义完成后，FrontendEngineer 可并行 Mock 开发
  → API 实现完成后，FrontendEngineer 对接真实接口
```

### Phase 7-8：测试与上线

```
QAEngineer → 测试报告 → CEO 审批 → DevOps 上线
```

## 协作规则

### 上游对下游负责

```
1. 上游必须输出结构化文档（按 OutputFormat.md 模板）
2. 文档存入 05-Output/{角色}/ 目录
3. 下游从 05-Output/ 读取上游输出
4. 如上游输出不完整，下游可以打回要求补充
```

### 并行规则

```
以下阶段内的角色可并行工作：
  Phase 3：UIDesigner / IoTEngineer / ZabbixEngineer
  Phase 5-6：BackendEngineer 先 API 定义 → FrontendEngineer 并行 Mock 开发

以下阶段有严格顺序：
  Phase 0 → Phase 1 → Phase 2（必须串行）
  Phase 2 → Phase 3（数据规则必须先确定）
```

### 阻塞处理

```
如果某个 Phase 输出不满足下游要求：
  1. 下游角色在对话中明确指出缺少什么
  2. 上游角色补充输出
  3. 阻塞记录在对话中标记 [#BLOCKED]
```

## 快速通道（Hotfix）

当出现紧急 Bug（如跌倒告警未推送），启动快速通道：

```
问题发现
  │
  ▼
ZabbixEngineer / BackendEngineer（直接定位修复）
  │
  ▼
QAEngineer（快速验证）
  │
  ▼
CEO（紧急审批）
  │
  ▼
DevOps（立即上线）
```

此流程跳过 Phase 0-2，全程不超过 2 小时。

## 产出物清单

| Phase | 角色 | 文件路径 |
|-------|------|----------|
| 1 | ProductManager | `05-Output/ProductManager/PRD-{name}-v{x}.md` |
| 1 | SmartCareExpert | `05-Output/SmartCareExpert/业务规范-{name}-v{x}.md` |
| 2 | DataAnalyst | `05-Output/DataAnalyst/分析-{name}-v{x}.md` |
| 3 | UIDesigner | `05-Output/UIDesigner/设计方案-{name}-v{x}.md` |
| 3 | IoTEngineer | `05-Output/IoTEngineer/接入方案-{name}-v{x}.md` |
| 3 | ZabbixEngineer | `05-Output/ZabbixEngineer/配置方案-{name}-v{x}.md` |
| 4 | AIEngineer | `05-Output/AIEngineer/工作流-{name}-v{x}.md` |
| 5 | BackendEngineer | `05-Output/BackendEngineer/API-{name}-v{x}.md` |
| 6 | FrontendEngineer | `05-Output/FrontendEngineer/实现-{name}-v{x}.md` |
| 7 | QAEngineer | `05-Output/QAEngineer/测试报告-{name}-v{x}.md` |
| 8 | DevOps | 上线确认记录 |
| 9 | DataAnalyst | `05-Output/DataAnalyst/优化报告-{name}-v{x}.md` |
