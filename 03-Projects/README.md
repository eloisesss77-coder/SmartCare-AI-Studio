# 03-Projects 项目代码目录

> 此目录存放各子项目的实际代码。代码由对应 AI Agent 角色在工作流中生成后放入此处。

## 子项目清单

| 子目录 | 类型 | 生成角色 | 技术栈 |
|--------|------|----------|--------|
| `SmartCareBackend/` | 后端服务 | BackendEngineer | Java + Spring Boot |
| `SmartCareWeb/` | 管理后台 Web | FrontendEngineer | React + Ant Design |
| `SmartCareApp/` | 家属端 APP | FrontendEngineer | React Native |
| `SmartCareAdmin/` | 护理员管理端 | FrontendEngineer | React + Ant Design Mobile |
| `SmartCareAI/` | AI 工作流 | AIEngineer | Dify 工作流导出 |
| `SmartCareIoT/` | IoT 边缘网关 | IoTEngineer | Python |
| `SmartCareMonitoring/` | 监控配置 | ZabbixEngineer | Zabbix Template + Grafana |

## 代码生成时机

代码在 AI 团队工作流中的对应阶段生成：

```
BackendEngineer → SmartCareBackend/
ZabbixEngineer  → SmartCareMonitoring/
AIEngineer      → SmartCareAI/
IoTEngineer     → SmartCareIoT/
FrontendEngineer → SmartCareWeb/ + SmartCareApp/ + SmartCareAdmin/
```

## 初始化说明

各子项目初始通过对应角色的 SOP 流程初始化生成。
