# SmartCare AI Agent Prompt 规范

> 本文档定义在 Trae 中调用各 AI Agent 时的 System Prompt 编写规范。所有 Agent 的 Agent.md 都遵循本规范。

## System Prompt 结构

每个 Agent 的 System Prompt 必须包含以下 5 个核心模块：

```
1. 身份定义（Identity）
   → 清楚说明"你是谁"，让 AI 建立角色认知

2. 核心职责（Responsibilities）
   → 明确"你负责什么"，划定职责边界

3. 领域知识（Domain Knowledge）
   → 补充"你需要知道的行业/技术知识"

4. 输出规范（Output Format）
   → 规定"你每次用什么样的格式输出"

5. 边界约束（Boundaries）
   → 明确"你不允许做什么"，防止越界
```

## Prompt 编写规则

### 规则 1：身份要具体

```
✅ 好：
"你是一名资深 Zabbix 监控专家，拥有 8 年以上 Zabbix 部署和二次开发经验，
精通 Item、Trigger、Template 和 Webhook 配置。"

❌ 差：
"你是一个 Zabbix 工程师。"
```

### 规则 2：职责要可执行

```
✅ 好：
"你的工作是：1) 将 IoT 设备数据接入 Zabbix  2) 配置 Item 和 Trigger
3) 编写 Webhook 脚本推送到 Dify  4) 封装 Zabbix API 供 Backend 调用"

❌ 差：
"你负责 Zabbix 相关的工作。"
```

### 规则 3：知识要结构化

```
✅ 好：用表格/列表组织知识
| 设备 | 接入方式 | Items | Triggers |
|------|----------|-------|----------|
| 雷达 | HTTP    | ...   | ...      |

❌ 差：大段文字描述
Zabbix 是一个监控系统，Item 是监控项，Trigger 是触发器...
```

### 规则 4：输出要模板化

```
✅ 好：
## 输出格式
### 1. 功能描述
### 2. 技术方案
### 3. 代码实现
### 4. 测试用例

❌ 差：
输出你的解决方案。
```

### 规则 5：边界要明确

```
✅ 好：
# 不允许做的事
- 不写业务后端代码（由 BackendEngineer 负责）
- 不设计 Dify 工作流（由 AIEngineer 负责）
- 不做 UI 设计

❌ 差：
（没有边界约束 → Agent 容易越界做不该做的事）
```

## Prompt 长度原则

```
最小长度：300 字（角色太简单无法建立认知）
推荐长度：500-1500 字（足够详细但不冗余）
最大长度：3000 字（超过会稀释关键信息）

关键信息放在前 500 字（AI 注意力衰减）
```

## 知识注入策略

```
System Prompt（Agent.md）
  → 角色核心知识：身份、职责、技术栈、领域知识
  → 每次对话都加载

SOP.md
  → 操作流程知识：怎么做、什么顺序
  → 在执行复杂任务时加载

Knowledge/ 目录
  → 参考资料：API 文档、配置示例、规范文件
  → 按需检索，不全部加载
```

## Agent 组合规则

当需要在一次对话中让多个 Agent 协作时：

```
# 场景：多 Agent 协作
你现在同时扮演以下角色：
1. ProductManager → 负责需求分析
2. BackendEngineer → 负责接口设计

规则：
- 先以 ProductManager 身份输出 PRD
- 再以 BackendEngineer 身份输出 API 设计
- 用 --- 分隔不同角色的输出
```

## 版本管理

```
每个 Agent.md 文件头部隐形约定：
- 版本：v1.0
- 最后更新：YYYY-MM-DD
- 更新原因：简述

修改 Agent Prompt 时：
1. 先备份当前版本
2. 更新内容
3. 通知相关下游角色（如 Rule 变更影响 Trigger）
```

## 禁止事项

- ❌ 在 Prompt 中使用模糊指令（"适当"、"合理"、"酌情"）
- ❌ 多个 Agent 的 Prompt 职责重叠（造成重复工作）
- ❌ Prompt 中硬编码临时信息（如具体 IP、密码、日期）
- ❌ 用英文 Prompt 执行中文任务（AI 英文模式下中文输出质量下降）
