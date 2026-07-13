-- ============================================================
-- SmartCare Monitor - 数据库初始化脚本
-- ============================================================

CREATE DATABASE IF NOT EXISTS smartcare
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE smartcare;

-- -----------------------------------------------------------
-- t_elderly: 老人信息表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_elderly (
    id                BIGINT        AUTO_INCREMENT PRIMARY KEY  COMMENT '主键ID',
    name              VARCHAR(50)   NOT NULL                     COMMENT '老人姓名',
    age               INT           DEFAULT 0                    COMMENT '年龄',
    gender            TINYINT       DEFAULT 0                    COMMENT '性别: 0未知, 1男, 2女',
    room_no           VARCHAR(20)   DEFAULT ''                   COMMENT '房间号',
    medical_history   TEXT                                       COMMENT '既往病史',
    emergency_contact VARCHAR(50)   DEFAULT ''                   COMMENT '紧急联系人',
    emergency_phone   VARCHAR(20)   DEFAULT ''                   COMMENT '紧急联系电话',
    institution_id    BIGINT        DEFAULT 0                    COMMENT '所属机构ID',
    radar_device_id   BIGINT        DEFAULT NULL                 COMMENT '绑定的雷达设备ID',
    status            TINYINT       DEFAULT 1                    COMMENT '状态: 0禁用, 1启用',
    created_at        DATETIME      DEFAULT CURRENT_TIMESTAMP    COMMENT '创建时间',
    updated_at        DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_institution (institution_id),
    INDEX idx_room_no (room_no),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='老人信息表';

-- -----------------------------------------------------------
-- t_radar_device: 雷达设备表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_radar_device (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    device_sn       VARCHAR(64)   NOT NULL                    COMMENT '设备序列号',
    device_name     VARCHAR(100)  DEFAULT ''                  COMMENT '设备名称',
    device_type     VARCHAR(50)   DEFAULT 'millimeter_wave'   COMMENT '设备类型',
    room_no         VARCHAR(20)   DEFAULT ''                  COMMENT '安装房间号',
    mqtt_topic      VARCHAR(200)  DEFAULT ''                  COMMENT 'MQTT订阅主题',
    ip_address      VARCHAR(50)   DEFAULT ''                  COMMENT '设备IP地址',
    firmware_version VARCHAR(30)  DEFAULT ''                  COMMENT '固件版本',
    online_status   TINYINT       DEFAULT 0                   COMMENT '在线状态: 0离线, 1在线',
    last_heartbeat  DATETIME      DEFAULT NULL                COMMENT '最后心跳时间',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
    updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_device_sn (device_sn),
    INDEX idx_online_status (online_status),
    INDEX idx_room_no (room_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='雷达设备表';

-- -----------------------------------------------------------
-- t_radar_data: 雷达原始数据表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_radar_data (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    device_id       BIGINT        NOT NULL                    COMMENT '雷达设备ID',
    elder_id        BIGINT        DEFAULT NULL                COMMENT '关联老人ID',
    fall_status     TINYINT       DEFAULT 0                   COMMENT '跌倒状态: 0正常, 1跌倒',
    heart_rate      INT           DEFAULT NULL                COMMENT '心率(次/分钟)',
    breath_rate     INT           DEFAULT NULL                COMMENT '呼吸率(次/分钟)',
    activity_level  VARCHAR(20)   DEFAULT ''                  COMMENT '活动等级: stationary/slight/moderate/vigorous',
    in_bed          TINYINT       DEFAULT 0                   COMMENT '是否在床: 0不在床, 1在床',
    body_posture    VARCHAR(30)   DEFAULT ''                  COMMENT '体态: lying/sitting/standing/walking',
    raw_json        TEXT                                      COMMENT '原始JSON数据',
    timestamp       DATETIME      NOT NULL                    COMMENT '数据采集时间戳',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '记录创建时间',
    INDEX idx_device_id (device_id),
    INDEX idx_elder_id (elder_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_fall_status (fall_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='雷达原始数据表';

-- -----------------------------------------------------------
-- t_alert_rule: 告警规则表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_alert_rule (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    rule_name       VARCHAR(100)  NOT NULL                    COMMENT '规则名称',
    rule_type       VARCHAR(50)   NOT NULL                    COMMENT '规则类型: fall/heart_rate/breath_rate/out_of_bed/inactivity',
    elder_id        BIGINT        DEFAULT NULL                COMMENT '关联老人ID(NULL表示全局规则)',
    threshold_value VARCHAR(100)  NOT NULL                    COMMENT '阈值(JSON格式)',
    severity        VARCHAR(20)   DEFAULT 'warning'           COMMENT '严重级别: info/warning/critical/emergency',
    enabled         TINYINT       DEFAULT 1                   COMMENT '是否启用: 0禁用, 1启用',
    notify_channels VARCHAR(200)  DEFAULT ''                  COMMENT '通知渠道(逗号分隔: dingtalk,wecom,sms)',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
    updated_at      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_rule_type (rule_type),
    INDEX idx_elder_id (elder_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则表';

-- -----------------------------------------------------------
-- t_alert_record: 告警记录表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_alert_record (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    elder_id        BIGINT        DEFAULT NULL                COMMENT '关联老人ID',
    device_id       BIGINT        DEFAULT NULL                COMMENT '关联设备ID',
    alert_type      VARCHAR(50)   NOT NULL                    COMMENT '告警类型',
    alert_level     VARCHAR(20)   NOT NULL DEFAULT 'warning'  COMMENT '告警级别: info/warning/critical/emergency',
    alert_message   VARCHAR(500)  NOT NULL                    COMMENT '告警消息内容',
    trigger_value   VARCHAR(100)  DEFAULT ''                  COMMENT '触发时的数值',
    rule_id         BIGINT        DEFAULT NULL                COMMENT '触发的规则ID',
    handled_status  TINYINT       DEFAULT 0                   COMMENT '处理状态: 0未处理, 1处理中, 2已处理',
    handled_by      VARCHAR(50)   DEFAULT ''                  COMMENT '处理人',
    handled_at      DATETIME      DEFAULT NULL                COMMENT '处理时间',
    handle_remark   VARCHAR(500)  DEFAULT ''                  COMMENT '处理备注',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
    INDEX idx_elder_id (elder_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_level (alert_level),
    INDEX idx_handled_status (handled_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警记录表';

-- -----------------------------------------------------------
-- t_dashboard_stats: Dashboard统计表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_dashboard_stats (
    id              BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    institution_id  BIGINT        NOT NULL                    COMMENT '机构ID',
    total_elderly   INT           DEFAULT 0                   COMMENT '老人总数',
    online_devices  INT           DEFAULT 0                   COMMENT '在线设备数',
    active_alerts   INT           DEFAULT 0                   COMMENT '活跃告警数',
    fall_count_today INT          DEFAULT 0                   COMMENT '今日跌倒次数',
    stat_date       DATE          NOT NULL                    COMMENT '统计日期',
    created_at      DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
    UNIQUE KEY uk_institution_date (institution_id, stat_date),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dashboard统计表';

-- ============================================================
-- 示例数据
-- ============================================================

-- 插入雷达设备
INSERT INTO t_radar_device (device_sn, device_name, device_type, room_no, mqtt_topic, ip_address, firmware_version, online_status) VALUES
('RADAR-2024001', '毫米波雷达A-101室', 'millimeter_wave', '101', 'smartcare/radar/101/data', '192.168.1.101', 'v2.1.3', 1),
('RADAR-2024002', '毫米波雷达A-102室', 'millimeter_wave', '102', 'smartcare/radar/102/data', '192.168.1.102', 'v2.1.3', 1),
('RADAR-2024003', '毫米波雷达A-103室', 'millimeter_wave', '103', 'smartcare/radar/103/data', '192.168.1.103', 'v2.1.3', 0);

-- 插入老人数据
INSERT INTO t_elderly (name, age, gender, room_no, medical_history, emergency_contact, emergency_phone, institution_id, radar_device_id, status) VALUES
('张大爷', 78, 1, '101', '高血压、糖尿病', '张小明', '13800138001', 1, 1, 1),
('李奶奶', 82, 2, '102', '冠心病、骨质疏松', '李小华', '13800138002', 1, 2, 1),
('王大爷', 75, 1, '103', '高血压', '王小红', '13800138003', 1, 3, 1);

-- 插入告警规则
INSERT INTO t_alert_rule (rule_name, rule_type, elder_id, threshold_value, severity, enabled, notify_channels) VALUES
('跌倒检测告警', 'fall', NULL, '{"fall_status": 1}', 'emergency', 1, 'dingtalk,wecom,sms,wechat'),
('心率异常告警', 'heart_rate', NULL, '{"min": 40, "max": 120}', 'critical', 1, 'dingtalk,wecom,wechat'),
('离床超时告警', 'out_of_bed', NULL, '{"max_minutes": 30}', 'warning', 1, 'dingtalk');

-- -----------------------------------------------------------
-- t_family: 家属账号表（关联微信小程序openid）
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_family (
    id          BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    openid      VARCHAR(100)  NOT NULL                    COMMENT '微信小程序openid',
    unionid     VARCHAR(100)  DEFAULT ''                  COMMENT '微信unionid',
    nickname    VARCHAR(50)   DEFAULT ''                  COMMENT '微信昵称',
    avatar_url  VARCHAR(500)  DEFAULT ''                  COMMENT '头像URL',
    phone       VARCHAR(20)   DEFAULT ''                  COMMENT '手机号',
    status      TINYINT       DEFAULT 1                   COMMENT '状态: 0禁用, 1启用',
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
    updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_openid (openid),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家属账号表';

-- -----------------------------------------------------------
-- t_family_elderly: 家属-老人绑定关系表
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS t_family_elderly (
    id          BIGINT        AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    family_id   BIGINT        NOT NULL                    COMMENT '家属账号ID',
    elderly_id  BIGINT        NOT NULL                    COMMENT '老人ID',
    relation    VARCHAR(20)   DEFAULT ''                  COMMENT '关系: 子女/配偶/亲属等',
    is_primary  TINYINT       DEFAULT 0                   COMMENT '是否主监护人: 0否, 1是',
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP   COMMENT '创建时间',
    UNIQUE KEY uk_family_elderly (family_id, elderly_id),
    INDEX idx_family_id (family_id),
    INDEX idx_elderly_id (elderly_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家属-老人绑定关系表';
