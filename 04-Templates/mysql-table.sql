-- ============================================================
-- {表中文说明}
-- 创建时间：{YYYY-MM-DD}
-- 创建人：SmartCare AI Studio
-- 数据库：smartcare
-- ============================================================

CREATE TABLE IF NOT EXISTS `t_{table_name}` (
  `id`              BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',

  -- ============ 业务字段 ============
  `name`            VARCHAR(100)  NOT NULL                     COMMENT '{字段说明}',
  `type`            VARCHAR(50)   DEFAULT ''                   COMMENT '{类型枚举/说明}',
  `status`          TINYINT       DEFAULT 1                    COMMENT '状态: 0禁用, 1启用',

  -- ============ 可选字段（按需取消注释）============
  -- `elder_id`      BIGINT        DEFAULT NULL                 COMMENT '关联老人ID',
  -- `device_id`     BIGINT        DEFAULT NULL                 COMMENT '关联设备ID',
  -- `threshold_value` VARCHAR(100) DEFAULT ''                 COMMENT '阈值(JSON格式)',
  -- `remark`        VARCHAR(500)  DEFAULT ''                  COMMENT '备注',

  -- ============ 审计字段 ============
  `created_at`      DATETIME      DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
  `updated_at`      DATETIME      DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP                 COMMENT '更新时间',

  -- ============ 索引（按实际查询场景添加）============
  INDEX `idx_{table}_status` (`status`),
  INDEX `idx_{table}_created_at` (`created_at`)

  -- 外键示例（不强制使用，视业务需要）
  -- ,CONSTRAINT `fk_{table}_elder` FOREIGN KEY (`elder_id`)
  --   REFERENCES `t_elderly`(`id`) ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='{表中文说明}';


-- ============================================================
-- 索引规范说明
-- ============================================================
-- 1. 主键统一 BIGINT AUTO_INCREMENT，不对外暴露业务含义
-- 2. 高选择性查询字段加前缀索引，格式 idx_{table}_{field}
-- 3. 复合索引按等值查询列在前、范围查询列在后排列
-- 4. 唯一约束独立成 UNIQUE KEY uk_{table}_{field}
-- 5. created_at 索引支撑按时间范围查询
-- 6. status 索引支撑状态筛选（值少可用但常规保留）
