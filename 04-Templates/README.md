# 04-Templates 项目模板

> 此目录存放可复用的代码和文档模板，供 AI Agent 快速生成新文件时引用。

## 模板清单

| 模板文件 | 用途 | 使用者 |
|----------|------|--------|
| `fastapi-router.py` | FastAPI Router 标准模板（CRUD + 分页 + 权限注入） | BackendEngineer |
| `react-component.tsx` | React 组件模板（Table 页面 + 三态处理） | FrontendEngineer |
| `mysql-table.sql` | MySQL 建表模板（t_ 前缀 + 审计字段 + 索引规范） | BackendEngineer |
| `zabbix-template.yaml` | Zabbix Template 模板（smartcare.radar.* Item Key） | ZabbixEngineer |
| `mqtt-gateway.py` | MQTT 网关脚本模板（paho-mqtt → POST /api/v1/radar/data） | IoTEngineer |
| `prd-template.md` | PRD 文档模板（含安伴 Guardian 场景示例） | ProductManager |

## 技术栈

所有模板基于安伴 Guardian 实际技术栈：

| 层 | 技术 |
|----|------|
| 后端 | Python FastAPI + SQLAlchemy + PyJWT |
| 前端 | React 18 + TypeScript + Ant Design 5 |
| 数据库 | MySQL 8.0 (InnoDB / utf8mb4) |
| 监控 | Zabbix 6.x Trapper 模式 |
| IoT | paho-mqtt → 数据解析 → HTTP POST 转发 |

## 使用方式

在 Trae 中让 AI Agent 生成代码时，引用对应模板作为参考格式。
前缀 `{Name}`、`{module}`、`{table_name}` 等占位符需替换为实际名称。
