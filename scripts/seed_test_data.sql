-- ===================================================
-- SmartCare 测试假数据
-- 直接在服务器 MySQL 中执行即可
-- ===================================================

-- 如果数据库已有数据，可先清理（谨慎使用！若不想清空请注释掉）
-- DELETE FROM t_family_elderly;
-- DELETE FROM t_bind_code;
-- DELETE FROM t_caregiver_elderly;
-- DELETE FROM t_radar_data;
-- DELETE FROM t_elderly;
-- DELETE FROM t_family;

-- ============ 1. 管理员账号 ============
-- 如果已经存在请跳过
INSERT IGNORE INTO t_user (username, password_hash, display_name, role, phone, status, created_at, updated_at)
VALUES ('admin', 'admin123', '管理员', 'super_admin', '13800000000', 1, NOW(), NOW());

-- ============ 2. 老人数据 ============
INSERT INTO t_elderly (name, age, gender, room_no, medical_history, emergency_contact, emergency_phone, status, created_at, updated_at)
VALUES
('张建国', 78, 1, '101', '高血压、糖尿病',   '张小明', '13800001111', 1, NOW(), NOW()),
('李秀兰', 75, 2, '102', '冠心病',           '李小红', '13800002222', 1, NOW(), NOW()),
('王德发', 82, 1, '103', '脑梗后遗症、高血压', '王大军', '13800003333', 1, NOW(), NOW()),
('赵桂英', 71, 2, '201', '骨质疏松',         '赵小芳', '13800004444', 1, NOW(), NOW());

-- 记录插入后的 elderly id（如果你的表已有数据，请手动调整 id）
-- 假设从 id=1 开始

-- ============ 3. 家属账号（固定 openid 用于测试）============
-- openid 设为固定值"test_openid_001"，小程序 app.tsx 里把 deviceId 写死为此值
-- 这样无论换设备、清缓存，登陆的都是同一个家属账号
INSERT INTO t_family (openid, nickname, phone, status, created_at, updated_at)
VALUES ('test_openid_001', '测试家属小明', '13900001111', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), phone = VALUES(phone);

-- 获取刚才插入的 family_id（通常自增，这里假设从 1 开始）

-- ============ 4. 家属绑定老人 ============
INSERT IGNORE INTO t_family_elderly (family_id, elderly_id, relation, is_primary, created_at)
VALUES
(1, 1, '子女', 1, NOW()),
(1, 2, '子女', 1, NOW()),
(1, 3, '子女', 1, NOW()),
(1, 4, '子女', 1, NOW());

-- ============ 5. 绑定码（供后续测试绑定流程）============
INSERT IGNORE INTO t_bind_code (bind_code, elderly_id, relation, generated_by, is_used, expire_at, created_at, updated_at)
VALUES
('TEST01', 1, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
('TEST02', 2, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
('TEST03', 3, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
('TEST04', 4, '子女', 1, 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW());

-- ============ 验证 ============
-- 跑完执行下面查询确认数据已写入：
-- SELECT * FROM t_elderly;
-- SELECT * FROM t_family;
-- SELECT * FROM t_family_elderly;
