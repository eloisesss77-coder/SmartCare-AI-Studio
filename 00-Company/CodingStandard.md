# SmartCare 编码规范

> 本文档为公司级编码规范，所有 Engineer 角色必须遵守。各角色 Agent.md 中的编码规则为本规范的子集或特化。

## 统一原则

1. **可读性优先**：代码是写给人看的，附带能在机器上运行
2. **一致性**：整个项目同一语言保持同一种风格
3. **最小惊讶**：命名、结构、行为符合常识预期
4. **防御性编程**：对外部输入做校验，对异常做处理

---

## Java 后端规范

### 命名规范

| 元素 | 规范 | 示例 |
|------|------|------|
| 包名 | 全小写，点分隔 | `com.smartcare.elder` |
| 类名 | PascalCase | `ElderController` |
| 方法名 | camelCase | `getElderById` |
| 常量 | UPPER_SNAKE_CASE | `MAX_ALERT_COUNT` |
| 变量 | camelCase | `elderName` |
| 数据库字段 | snake_case | `elder_name` |
| REST API | kebab-case | `/api/v1/elder-info` |

### 分层规范

```
Controller  →  只做参数校验和结果封装，无业务逻辑
  ↓
Service     →  核心业务逻辑，事务控制，缓存逻辑
  ↓
Mapper      →  纯数据库操作，无业务逻辑
```

### 注解规范

```java
// Controller 层必须有
@RestController
@RequestMapping("/api/v1/elder")
@Api(tags = "老人管理")          // Knife4j
public class ElderController {

    @GetMapping("/{id}")
    @ApiOperation("根据ID查询老人")
    public ApiResult<ElderVO> getById(@PathVariable @ApiParam("老人ID") Long id) {
        // 不写业务逻辑
        return ApiResult.success(elderService.getById(id));
    }
}

// Service 层必须有
@Service
@Slf4j
public class ElderServiceImpl implements ElderService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    @Log(description = "创建老人档案")  // 自定义日志注解
    public ElderVO create(ElderCreateDTO dto) {
        // 业务逻辑
    }
}
```

### 禁止事项

- ❌ Controller 中写业务逻辑
- ❌ Service 中直接操作 HttpServletRequest/Response
- ❌ 返回原始 Entity 给前端（必须用 VO 包装）
- ❌ 硬编码魔法值（用枚举或常量）
- ❌ 使用 `System.out.println`（用 @Slf4j）
- ❌ 吞异常（必须记录日志或向上抛）
- ❌ 循环中操作数据库（用批量操作）
- ❌ SQL 拼接（用 MyBatis-Plus 参数化查询）

---

## TypeScript 前端规范

### 命名规范

| 元素 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `ElderCard.tsx` |
| 样式文件 | camelCase | `elderCard.module.less` |
| 工具函数 | camelCase | `formatDate.ts` |
| 类型文件 | camelCase | `elder.ts` |
| 变量/函数 | camelCase | `elderName` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 接口/类型 | PascalCase + I/T 可选 | `ElderVO` / `IElderProps` |

### 组件规范

```typescript
// 组件文件结构：严格按以下顺序
// 1. React 核心导入
import React, { useState, useEffect, useCallback } from 'react';

// 2. 第三方库导入
import { Card, Button } from 'antd';

// 3. 本地导入
import type { ElderCardProps } from './types';
import { useElderData } from './hooks';
import styles from './elderCard.module.less';

// 4. 组件定义
export const ElderCard: React.FC<ElderCardProps> = ({
  elderId,
  onAction,
}) => {
  // 5. State
  // 6. Effects
  // 7. Handlers
  // 8. Render helpers
  // 9. JSX return
  return <div className={styles.container}>...</div>;
};
```

### 状态管理规范

```
服务端数据  →  React Query（缓存、去重、重试）
客户端状态  →  Zustand（轻量全局状态）
组件内部状态 →  useState
```

### 禁止事项

- ❌ 使用 `any` 类型
- ❌ 直接修改 state（用 setState 或 immer）
- ❌ 在 render 中定义组件内组件
- ❌ 使用 index 作为 key（列表项必须有稳定 id）
- ❌ 忘记清除定时器/订阅（useEffect cleanup）
- ❌ 内联样式（用 CSS Modules）
- ❌ API 请求缺少 loading/error 处理

---

## Python（IoT 边缘网关）规范

### 命名规范

| 元素 | 规范 | 示例 |
|------|------|------|
| 文件名 | snake_case | `mqtt_gateway.py` |
| 类名 | PascalCase | `SmartCareGateway` |
| 函数 | snake_case | `on_radar_data` |
| 变量 | snake_case | `elder_id` |
| 常量 | UPPER_SNAKE_CASE | `MQTT_BROKER_URL` |

### 代码规范

```python
"""模块文档字符串：简述功能"""

import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SmartCareGateway:
    """IoT 边缘网关，负责设备数据接入和转发"""

    def __init__(self, broker_url: str, institution_id: str):
        self.broker_url = broker_url
        self.institution_id = institution_id

    def on_radar_data(self, elder_id: str, raw: Dict[str, Any]) -> None:
        """处理雷达数据"""
        cleaned = self._clean_radar_data(raw)
        self._publish(elder_id, "radar", cleaned)

    def _clean_radar_data(self, raw: Dict) -> Dict:
        """数据清洗：去噪、补全"""
        if raw.get("activity_level", 0) > 100:
            raw["activity_level"] = 100
        raw.setdefault("timestamp", int(time.time()))
        return raw
```

### 禁止事项

- ❌ 裸 `except:`（至少 `except Exception as e`）
- ❌ 硬编码 IP/密码（用环境变量或配置文件）
- ❌ `print()` 替代 `logging`
- ❌ 类型注解缺失

---

## SQL 规范

```sql
-- 命名：snake_case，表名 t_ 前缀
CREATE TABLE t_elder (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name        VARCHAR(50)  NOT NULL                COMMENT '姓名',
    gender      TINYINT      NOT NULL DEFAULT 0      COMMENT '性别：0-未知 1-男 2-女',
    age         INT          NOT NULL                COMMENT '年龄',
    id_card     VARCHAR(18)                          COMMENT '身份证号（加密存储）',
    institution_id BIGINT    NOT NULL                COMMENT '机构ID',
    status      TINYINT      NOT NULL DEFAULT 1      COMMENT '状态：0-禁用 1-正常',
    create_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='老人档案表';
```

**强制**：每列有 COMMENT，每表有 COMMENT，索引有命名。

---

## 通用规则

### 注释规范

```
✅ 好的注释：解释 WHY，不是 WHAT
   // 告警超时 5 秒设为此值，因为纳米雷达数据上报频率是 2 秒/次

❌ 差的注释：重复代码
   // 设置超时为 5 秒
   timeout = 5;
```

### 日志规范

```
Java:  log.info("创建老人档案, elderId={}", id);
TS:    console.info("ElderCard mounted", { elderId });
Python: logger.info("Radar data received, elder_id=%s", elder_id);
```

### 异常处理

```
对待外部依赖（数据库、API、MQ）：
  ✅ 必须 try-catch，记录日志
  ✅ 有超时设置
  ✅ 有重试机制（<= 3 次）

对待内部逻辑：
  ✅ 通过参数校验提前拒绝非法输入
  ✅ 不应捕获可预见的编程错误（NPE 等）
```
