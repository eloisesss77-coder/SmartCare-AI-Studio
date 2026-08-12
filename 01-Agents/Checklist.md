# 检查清单（Checklist）

## 后端检查清单（FastAPI）

```
□ Pydantic Schema 完整（请求/响应模型，alias_generator=to_camel 自动转换）
□ Depends 依赖注入正确（get_db / get_current_user / 路由级注入）
□ 返回格式统一为 ApiResponse { code, message, data }
□ @router 装饰器正确（prefix + tags + response_model）
□ 数据库 Session 通过 Depends(get_db) 注入，事务自动 commit/rollback
□ 异常使用 HTTPException + status_code，不抛原始异常
□ OpenAPI/Swagger 文档可正常访问（/docs）
□ APScheduler 定时任务正确注册（daily_report 等）
□ JWT 认证：Token 有效期 120 分钟，HS256 算法
□ 告警 webhook 接口无认证（/api/v1/alerts webhook 端点）
□ C 端接口使用 X-Family-Id Header 标识家属（不校验 JWT）
□ 身份证、手机号等敏感字段脱敏
□ SQL 查询无 N+1 问题（使用 joinedload / selectinload）
□ 日志使用 logging.getLogger(__name__)
```

## 前端检查清单（React Web 管理端）

```
□ TypeScript 类型完整，接口定义在 types/index.ts
□ 组件三态完整：loading（Spin/Skeleton）、error（Result/Alert）、empty（Empty）
□ UI 优先使用 Ant Design 组件（不引入额外 UI 库）
□ 认证状态通过 AuthContext 管理，路由守卫 ProtectedRoute / AdminRoute
□ API 调用统一走 services/api.ts 的 Axios 实例
□ Axios 拦截器：自动附加 Authorization Header + 401 跳转登录
□ 每个页面在 App.tsx 中注册路由
□ 使用 App.useApp() 获取 message/notification API
□ 自定义样式写在同目录 .css 文件
□ 浏览器控制台无 warning/error（React 严格模式可忽略）
```

## 小程序检查清单（Taro）

```
□ 页面路径在 app.config.ts 中正确注册
□ API 调用使用 Taro.request 封装（services/api.ts），不使用 Web fetch/axios
□ 所有认证请求自动附加 X-Family-Id Header
□ ensureAuth 机制：登录完成前暂停所有 API 调用（loginReady 状态）
□ 使用 Taro API（Taro.navigateTo / getStorageSync / showToast），不用 Web API
□ 老人详情页实现 10s 轮询刷新（实时健康数据）
□ Tab 配置正确（3 个底部导航：首页/告警/我的）
□ Storage 操作用于存储 familyId 等持久化数据
□ 适老化：大字号、高对比度、大触控区域
□ wx.login 上线前替换固定 openid
```

## 数据库检查清单

```
□ 表名使用 t_ 前缀（t_elderly, t_radar_device 等）
□ 字段命名使用 snake_case（fall_status, heart_rate）
□ 主键使用自增 id（INT AUTO_INCREMENT）
□ 外键关系正确（RadarData.elderly_id → Elderly.id 等）
□ 索引合理（高频查询字段：elderly_id, sn, created_at）
□ 告警记录表有 status 字段（pending / processing / resolved）
□ BindCode 表有 expires_at 字段（24 小时过期逻辑）
```

## IoT 数据检查清单

```
□ MQTT Topic 规范：smartcare/{device_type}/{device_sn}/data
□ 数据格式统一为 JSON（字段：sn, timestamp, 业务数据...）
□ 设备 SN 唯一，与 RadarDevice 表 sn 字段对应
□ 雷达数据字段完整：fall_status, heart_rate, respiratory_rate,
  in_bed, activity_level, posture
□ 设备心跳机制：30 分钟无数据上报 → 标记离线
□ 数据延迟 < 3 秒
```

## PRD 检查清单

```
□ 需求背景清晰（为什么做、解决什么问题）
□ 用户故事完整（As a / I want / So that 格式）
□ 核心功能流程描述（Happy Path）
□ 异常流程描述（设备离线、网络超时、数据异常）
□ 数据需求说明（需要哪些字段、从哪里获取）
□ 验收标准明确（可量化、可测试）
```

## UI 设计检查清单

```
□ 适老化设计原则（大字体、高对比度、简洁布局）
□ 可点击元素触控区域 ≥ 48×48px
□ 告警色区分明确（红/橙/黄/蓝 四级）
□ 移动端适配（小程序 375px 宽度基准）
□ 加载状态友好（Skeleton 占位，避免白屏）
□ 有 Design Token 或 CSS 变量统一样式
```
