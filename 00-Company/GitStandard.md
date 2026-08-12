# SmartCare Git 协作规范

> 本文档定义 AI Agent 团队使用 Git 进行代码版本控制的规范。

## 分支策略

采用 **简化版 Git Flow**（不引入 develop 分支的复杂度）：

```
main（生产分支，永远可部署）
  │
  ├── feature/功能名（功能开发分支）
  │    从 main 拉出，开发完成后合并回 main
  │
  ├── fix/bug描述（Bug 修复分支）
  │    从 main 拉出，修复完成后合并回 main
  │
  └── hotfix/紧急修复（紧急线上修复）
       从 main 拉出，修复后合并回 main
```

### 分支命名规范

```
feature/f-{功能编号}-{简短描述}
  例：feature/f-02-fall-detection-alert

fix/bug-{简短描述}
  例：fix/heart-rate-false-positive

hotfix/{描述}
  例：hotfix/zabbix-webhook-timeout
```

## Commit Message 规范

采用 **Conventional Commits** 规范：

```
<type>(<scope>): <简短描述>

[可选详细描述]

[可选关联任务编号]

类型（type）：
  feat      → 新功能
  fix       → Bug 修复
  docs      → 文档变更
  style     → 代码格式（不影响功能）
  refactor  → 重构（不新增功能/不修复 bug）
  perf      → 性能优化
  test      → 测试相关
  chore     → 构建/工具变更

范围（scope）：
  backend   → 后端
  frontend  → 前端
  zabbix    → Zabbix 配置
  dify      → Dify 工作流
  iot       → IoT 设备
  docs      → 文档
  template  → 模板
```

### 示例

```
feat(backend): 新增跌倒告警处理API

新增 /api/v1/alert/handle 接口，支持护理员标记已处理

关联：F-02
```

```
fix(zabbix): 修复心率 Trigger 夜间误报问题

调整夜间心率阈值从 120 降到 110 bpm

关联：F-03
```

```
docs(product): 更新 Phase 2 产品路线图
```

## 提交粒度

```
✅ 好：一个 commit 做一件事
   feat(backend): 新增老人档案查询接口
   feat(backend): 新增老人档案创建接口

❌ 差：一个 commit 做多件事
   feat: 新增老人接口 + 修复告警 + 调整样式
```

## 代码提交前检查

所有代码提交前，必须通过对应角色的 Checklist：

```
BackendEngineer  → BackendEngineer/SOP.md 中的提交前自检
FrontendEngineer → FrontendEngineer/SOP.md 中的提交前自检
ZabbixEngineer   → Checklist.md 中的 Zabbix 配置必检
...
```

## 文件忽略规则（.gitignore）

```gitignore
# 环境变量（敏感信息）
.env
.env.local
*.pem
*.key

# IDE
.idea/
.vscode/
*.swp
*.swo

# 依赖
node_modules/
target/
__pycache__/
*.pyc

# 构建产物
dist/
build/
.next/

# 日志
*.log
logs/

# 上传文件
uploads/

# OS
.DS_Store
Thumbs.db
```

## 不允许的操作

- ❌ 直接推送到 main 分支（必须通过 PR/MR）
- ❌ `git push --force` 到 main（严禁）
- ❌ `git reset --hard` 已推送的提交
- ❌ 提交包含密钥/密码的文件（.env、pem 等）
- ❌ 提交二进制文件（jar、exe、图片资源除外）
- ❌ 一个 commit 包含不相关的多个修改
- ❌ 不经测试直接合并到 main
