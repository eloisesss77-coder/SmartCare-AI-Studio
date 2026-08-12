# SmartCare UI/UX 设计规范

> 本文档为公司级 UI 标准，供 UIDesigner（设计）和 FrontendEngineer（实现）共同遵守。详细设计 Token 见 [UIDesigner/Agent.md](../01-Agents/UIDesigner/Agent.md)。

## 设计原则

1. **适老化优先**：所有设计以 75+ 岁老人能无障碍使用为最低标准
2. **温暖简洁**：拒绝冷冰冰的医疗风格，采用温暖色彩和圆润造型
3. **信息聚焦**：每屏一个核心任务，避免认知过载
4. **容错设计**：关键操作需确认，误操作可撤销

## 色彩系统

```
主色调：
  --color-primary:    #F5A623    温暖橙（信任、关怀）
  --color-primary-hover: #E8961A
  --color-primary-active: #D48915

语义色：
  --color-success:    #7ED321    柔和绿（正常、健康）
  --color-warning:    #FFB020    柔和黄（注意）
  --color-danger:     #E86E6E    柔和红（告警，非刺眼红）
  --color-info:       #5B9BD5    柔和蓝（提示）

背景色：
  --bg-page:          #FAFAF8    暖白背景
  --bg-card:          #FFFFFF    卡片白
  --bg-sidebar:       #2C3E50    侧边栏深色（管理端）

文字色：
  --text-primary:     #333333    主要文字
  --text-secondary:   #666666    次要文字
  --text-disabled:    #999999    禁用文字（尽量不用）

告警色（分级）：
  --alert-urgent:     #E86E6E    🔴 紧急
  --alert-important:  #F5A623    🟠 重要
  --alert-normal:     #FFB020    🟡 一般
  --alert-tips:       #5B9BD5    🔵 提示
  --alert-device:     #999999    ⚪ 设备
```

## 字体系统

```
字体族：
  -apple-system, BlinkMacSystemFont, "PingFang SC",
  "Microsoft YaHei", "Helvetica Neue", sans-serif

字号层级（适老化加强）：
  --font-h1:     28px / 1.4   页面主标题
  --font-h2:     22px / 1.4   区块标题
  --font-h3:     18px / 1.5   卡片标题
  --font-body:   16px / 1.6   正文（最小值）
  --font-caption: 14px / 1.5  辅助说明（底线）

注意：不超过 14px 的字号禁止出现在任何面向老人的页面！
```

## 间距系统（8px 栅格）

```
--spacing-xs:   4px
--spacing-sm:   8px
--spacing-md:   16px
--spacing-lg:   24px
--spacing-xl:   32px
--spacing-xxl:  48px
```

## 圆角与阴影

```
圆角：
  --radius-sm:   4px   输入框、标签
  --radius-md:   8px   卡片、面板
  --radius-lg:   12px  大卡片、弹窗

阴影：
  --shadow-card:  0 2px 8px rgba(0,0,0,0.08)    卡片投影
  --shadow-modal: 0 4px 16px rgba(0,0,0,0.12)   弹窗投影
  --shadow-float: 0 8px 24px rgba(0,0,0,0.16)   浮层投影
```

## 组件规范

### 按钮

```
主要按钮：主色调填充，白色文字，48px 最小高度
次要按钮：主色调边框，主色调文字
危险按钮：红色调，用于删除/取消等破坏性操作
文字按钮：无背景无边框，仅文字，用于辅助操作

老人端特殊要求：
  - 所有按钮最小 56px 高度（比普通大一圈）
  - 按钮间距 ≥ 16px
  - SOS 按钮：120x120px，红色，页面右下角固定
```

### 卡片

```
基础卡片：白色背景，8px 圆角，0 0 8px rgba(0,0,0,0.08) 阴影
告警卡片：左侧色条标识等级，右侧内容区
健康卡片：顶部图标+数值，底部趋势线
日报卡片：日期标题 + 指标网格 + AI 小结
```

### 数据大屏

```
布局：左右两栏 + 中间地图
刷新：5 秒自动刷新，右上角显示刷新时间
字体：标题 32px，数据 48px，辅助 16px
颜色：深色背景 (#0A1628)，亮色数据，保证对比度
```

## 适老化强制要求

| 要求 | 标准 | 验证方式 |
|------|------|----------|
| 最小字号 | ≥ 14px（H5），≥ 16px（APP） | CSS 审查 |
| 最小点击区 | ≥ 48x48px（H5），≥ 56x56px（老人APP） | 审查 |
| 颜色对比度 | ≥ 4.5:1（正文），≥ 3:1（大文字） | WCAG 检查工具 |
| 行间距 | ≥ 1.5 | CSS 审查 |
| 段落间距 | ≥ 1.5 倍行高 | CSS 审查 |
| 动效时长 | ≤ 0.3s（避免眩晕） | 审查 |
| 键盘导航 | 所有交互支持 Tab + Enter | 手动测试 |

## 三端适配

| 端 | 视口 | 布局 | 特殊要求 |
|-----|------|------|----------|
| 管理后台 Web | 1440px+ | 侧边栏+内容区 | 数据表格、大屏 |
| 护理员平板 | 768-1024px | 单栏+底部导航 | 触控优先 |
| 家属手机 | 375-428px | 单栏卡片流 | 手势操作 |
| 老人端 | 375-428px | 极简单页 | 超大字体+语音 |
