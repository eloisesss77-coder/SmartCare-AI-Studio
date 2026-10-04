-- ===================================================
-- SmartCare 测试假数据（完整版）
-- 直接在服务器 MySQL 中执行即可
--
-- 覆盖：管理员 / 老人 / 雷达设备 / 雷达数据 / 告警 / 家属绑定
-- 说明：
--   1. 脚本尽量幂等：老人按姓名去重、家属按 openid 去重、
--      雷达设备按 device_sn 去重、绑定关系按 (family_id, elderly_id) 去重。
--   2. 雷达数据与告警没有唯一键，重复执行会重复插入，测试时如需重跑
--      请先执行文件末尾的「清理」段落。
-- ===================================================

-- ============ 1. 管理员账号（username 唯一，已存在则跳过）============
-- 注意：当前后端登录是明文比对 password_hash，所以这里直接存明文密码。
INSERT IGNORE INTO t_user (username, password_hash, display_name, role, phone, status, created_at, updated_at)
VALUES ('admin', 'admin123', '管理员', 'super_admin', '13800000000', 1, NOW(), NOW());

-- ============ 2. 老人数据（按姓名去重）============
INSERT INTO t_elderly (name, age, gender, room_no, medical_history, emergency_contact, emergency_phone, institution_id, radar_device_id, status, created_at, updated_at)
SELECT * FROM (
    SELECT '张建国' name, 78 age, 1 gender, '101' room, '高血压、糖尿病' mh, '张小明' ec, '13800001111' ep, 0 inst, NULL rid, 1 st, NOW() ct, NOW() ut
    UNION ALL SELECT '李秀兰', 75, 2, '102', '冠心病',           '李小红', '13800002222', 0, NULL, 1, NOW(), NOW()
    UNION ALL SELECT '王德发', 82, 1, '103', '脑梗后遗症、高血压', '王大军', '13800003333', 0, NULL, 1, NOW(), NOW()
    UNION ALL SELECT '赵桂英', 71, 2, '201', '骨质疏松',         '赵小芳', '13800004444', 0, NULL, 1, NOW(), NOW()
) t
WHERE NOT EXISTS (SELECT 1 FROM t_elderly e WHERE e.name = t.name);

-- ============ 3. 雷达设备（device_sn 唯一，已存在则跳过）============
INSERT IGNORE INTO t_radar_device (device_sn, device_name, device_type, room_no, mqtt_topic, ip_address, firmware_version, online_status, last_heartbeat, created_at, updated_at)
VALUES
('RADAR-101', '床头心率雷达-101', 'millimeter_wave', '101', 'radar/101', '192.168.1.101', 'v1.2.0', 1, NOW(), NOW(), NOW()),
('RADAR-102', '床头心率雷达-102', 'millimeter_wave', '102', 'radar/102', '192.168.1.102', 'v1.2.0', 1, NOW(), NOW(), NOW()),
('RADAR-103', '床头心率雷达-103', 'millimeter_wave', '103', 'radar/103', '192.168.1.103', 'v1.2.0', 1, NOW(), NOW(), NOW()),
('RADAR-201', '床头心率雷达-201', 'millimeter_wave', '201', 'radar/201', '192.168.1.201', 'v1.2.0', 1, NOW(), NOW(), NOW());

-- ============ 4. 绑定老人 → 雷达设备（按房间号匹配）============
UPDATE t_elderly e
JOIN t_radar_device d ON d.room_no = e.room_no
SET e.radar_device_id = d.id;

-- ============ 5. 雷达数据（最近 7 天，每天 3 个时间点）============
-- 让首页 latestRadarData、详情页 radar-data、健康日报 daily-reports 都有数据
INSERT INTO t_radar_data (device_id, elder_id, fall_status, heart_rate, breath_rate, activity_level, in_bed, body_posture, raw_json, timestamp, created_at)
SELECT
    d.id,
    e.id,
    IF(RAND() < 0.03, 1, 0),
    58 + FLOOR(RAND() * 24),
    13 + FLOOR(RAND() * 8),
    ELT(1 + FLOOR(RAND() * 4), 'stationary', 'low', 'moderate', 'active'),
    IF(RAND() > 0.5, 1, 0),
    ELT(1 + FLOOR(RAND() * 4), 'lying', 'sitting', 'standing', 'walking'),
    '{}',
    DATE_SUB(NOW(), INTERVAL (dys.n * 24 + sl.s * 8) HOUR),
    NOW()
FROM t_elderly e
JOIN t_radar_device d ON d.id = e.radar_device_id
JOIN (
    SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) dys
JOIN (
    SELECT 0 s UNION ALL SELECT 1 UNION ALL SELECT 2
) sl;

-- ============ 6. 告警记录（每位老人几条，覆盖不同级别/类型）============
INSERT INTO t_alert_record (elder_id, device_id, alert_type, alert_level, alert_message, trigger_value, rule_id, handled_status, handled_by, handled_at, handle_remark, created_at)
SELECT e.id, e.radar_device_id, 'fall', 'emergency', CONCAT(e.name, ' 在房间内检测到跌倒'), 'fall=1', NULL, 0, '', NULL, '', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM t_elderly e WHERE e.name = '张建国'
UNION ALL
SELECT e.id, e.radar_device_id, 'heart_rate', 'warning', CONCAT(e.name, ' 心率偏高'), 'hr=105', NULL, 0, '', NULL, '', DATE_SUB(NOW(), INTERVAL 3 HOUR)
FROM t_elderly e WHERE e.name = '张建国'
UNION ALL
SELECT e.id, e.radar_device_id, 'breath_rate', 'critical', CONCAT(e.name, ' 呼吸率异常'), 'br=32', NULL, 0, '', NULL, '', DATE_SUB(NOW(), INTERVAL 5 HOUR)
FROM t_elderly e WHERE e.name = '李秀兰'
UNION ALL
SELECT e.id, e.radar_device_id, 'fall', 'emergency', CONCAT(e.name, ' 在房间内检测到跌倒'), 'fall=1', NULL, 1, '家属', DATE_SUB(NOW(), INTERVAL 8 HOUR), '已前往查看', DATE_SUB(NOW(), INTERVAL 8 HOUR)
FROM t_elderly e WHERE e.name = '王德发'
UNION ALL
SELECT e.id, e.radar_device_id, 'inactivity', 'warning', CONCAT(e.name, ' 长时间未检测到活动'), 'inactive=45min', NULL, 0, '', NULL, '', DATE_SUB(NOW(), INTERVAL 12 HOUR)
FROM t_elderly e WHERE e.name = '王德发'
UNION ALL
SELECT e.id, e.radar_device_id, 'heart_rate', 'info', CONCAT(e.name, ' 心率偏低'), 'hr=52', NULL, 0, '', NULL, '', DATE_SUB(NOW(), INTERVAL 20 HOUR)
FROM t_elderly e WHERE e.name = '赵桂英';

-- ============ 7. 家属账号（openid 唯一，已存在则更新）============
-- openid 固定为 test_openid_001，与小程序 app.tsx 中写死值一致
INSERT INTO t_family (openid, nickname, phone, status, created_at, updated_at)
VALUES ('test_openid_001', '测试家属小明', '13900001111', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), phone = VALUES(phone);

-- ============ 8. 家属绑定全部老人（唯一约束去重）============
INSERT IGNORE INTO t_family_elderly (family_id, elderly_id, relation, is_primary, created_at)
SELECT f.id, e.id, '子女', 1, NOW()
FROM t_family f
CROSS JOIN t_elderly e
WHERE f.openid = 'test_openid_001';

-- ============ 9. 绑定码（供 Web 端测试绑定码流程）============
INSERT IGNORE INTO t_bind_code (bind_code, elderly_id, relation, generated_by, is_used, expire_at, created_at, updated_at)
SELECT 'TEST01', id, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW() FROM t_elderly WHERE name = '张建国'
UNION ALL SELECT 'TEST02', id, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW() FROM t_elderly WHERE name = '李秀兰'
UNION ALL SELECT 'TEST03', id, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW() FROM t_elderly WHERE name = '王德发'
UNION ALL SELECT 'TEST04', id, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW() FROM t_elderly WHERE name = '赵桂英';

-- ============ 验证 ============
-- SELECT id, name, room_no, radar_device_id FROM t_elderly;
-- SELECT id, device_sn, room_no FROM t_radar_device;
-- SELECT COUNT(*) AS radar_data_count FROM t_radar_data;
-- SELECT id, elder_id, alert_type, alert_level, handled_status FROM t_alert_record ORDER BY created_at DESC LIMIT 20;
-- SELECT * FROM t_family WHERE openid = 'test_openid_001';
-- SELECT f.id family_id, e.name, e.room_no FROM t_family_elderly fe JOIN t_family f ON f.id=fe.family_id JOIN t_elderly e ON e.id=fe.elderly_id WHERE f.openid='test_openid_001';

-- ============ 清理（需要重跑雷达数据/告警时执行，谨慎！）============
-- DELETE FROM t_radar_data;
-- DELETE FROM t_alert_record;
-- DELETE FROM t_family_elderly;
-- DELETE FROM t_bind_code;
-- DELETE FROM t_radar_device;
-- DELETE FROM t_elderly;
-- DELETE FROM t_family;
