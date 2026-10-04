"""一键初始化演示数据脚本
清空旧表 → 创建假数据 → 立即能看到原型效果
"""
import sys
import os
from datetime import datetime, timedelta, date
import random

# 把 backend 加进 path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import (
    Family, FamilyElderly, Elderly, DeviceGeneric, RadarDevice, RadarData,
    AlertRecord, AlertRule, DailyReport, BindCode,
)


def init():
    print("=" * 60)
    print("安伴 Guardian 演示数据初始化")
    print("=" * 60)

    # 1. 删旧表（按外键顺序）
    print("\n[1/4] 删除旧表...")
    Base.metadata.drop_all(bind=engine)
    print("  ✓ 旧表已清空")

    # 2. 建新表
    print("\n[2/4] 创建新表...")
    Base.metadata.create_all(bind=engine)
    print("  ✓ 表结构已创建")

    db = SessionLocal()
    try:
        # 3. 创建数据
        print("\n[3/4] 写入演示数据...")

        # === 家属 ===
        family = Family(
            openid="demo_openid_placeholder",  # 占位符，真实 openid 登录时会替换
            nickname="七七",
            avatar_url="",
            family_name="家庭A",
            family_role="admin",
        )
        db.add(family)
        db.flush()
        print(f"  ✓ 家属: familyId={family.id}")

        # === 老人 ===
        elder1 = Elderly(name="张建国", age=72, gender=1, room_no="主卧", family_id=family.id, status=1)
        elder2 = Elderly(name="李桂兰", age=68, gender=2, room_no="次卧", family_id=family.id, status=1)
        db.add_all([elder1, elder2])
        db.flush()
        print(f"  ✓ 老人: {elder1.name}, {elder2.name}")

        # === 绑定关系 ===
        db.add_all([
            FamilyElderly(family_id=family.id, elderly_id=elder1.id, relation="父亲", elder_role="admin", is_primary=1),
            FamilyElderly(family_id=family.id, elderly_id=elder2.id, relation="母亲", elder_role="admin"),
        ])
        db.flush()
        print("  ✓ 家属-老人绑定关系")

        # === 设备 ===
        now = datetime.now()
        device_specs = [
            # (elder_id, category, name)
            (elder1.id, "radar_bedhead", "床头睡眠雷达"),
            (elder1.id, "door_magnet", "入户门磁"),
            (elder2.id, "radar_living", "客厅壁挂雷达"),
            (elder2.id, "smoke_detector", "烟雾报警器"),
            (elder1.id, "camera", "客厅摄像头"),
        ]
        devices = []
        for i, (eid, cat, name) in enumerate(device_specs):
            d = DeviceGeneric(
                device_sn=f"ANB-{cat}-{1000 + i}",
                device_name=name,
                device_category=cat,
                room_no="主卧" if i in (0, 4) else ("次卧" if i == 2 else "入户"),
                elder_id=eid,
                online_status=1 if i < 4 else 0,  # 最后一个离线
                last_heartbeat=now - timedelta(minutes=random.randint(1, 30)),
            )
            db.add(d)
            devices.append(d)
        db.flush()
        print(f"  ✓ {len(devices)} 台设备已创建")

        # === 雷达数据（最近 24 小时，每 5 分钟一条）===
        print("  正在生成 24 小时雷达数据...")
        for elder in [elder1, elder2]:
            rds = db.query(RadarDevice).first()  # 复用一个 RadarDevice 作 device_id
            if not rds:
                rds = RadarDevice(device_sn="RADAR-0001", device_name="演示雷达")
                db.add(rds)
                db.flush()

            start_time = now - timedelta(hours=24)
            n_points = 24 * 12  # 每 5 分钟 1 条
            for j in range(n_points):
                ts = start_time + timedelta(minutes=5 * j)
                hr = random.randint(55, 85)
                br = random.randint(14, 20)
                in_bed = 1 if (ts.hour >= 22 or ts.hour <= 6) else 0
                radar = RadarData(
                    device_id=rds.id,
                    elder_id=elder.id,
                    fall_status=1 if (elder.id == elder1.id and ts.hour == 3 and j % 30 == 0) else 0,
                    heart_rate=hr,
                    breath_rate=br,
                    activity_level=random.choice(["stationary", "slight", "moderate"]),
                    in_bed=in_bed,
                    body_posture=random.choice(["lying", "sitting", "standing"]),
                    timestamp=ts,
                )
                db.add(radar)
        db.flush()
        print("  ✓ 24 小时雷达数据已写入")

        # === 告警规则 ===
        rules = [
            AlertRule(rule_name="跌倒立即告警", rule_type="fall", threshold_value='{"minFallDuration":3}', severity="emergency", enabled=1),
            AlertRule(rule_name="心率过高", rule_type="heart_rate", threshold_value='{"max":120}', severity="critical", enabled=1),
            AlertRule(rule_name="长时间静止", rule_type="inactivity", threshold_value='{"maxIdleMinutes":60}', severity="warning", enabled=1),
        ]
        db.add_all(rules)
        db.flush()
        print(f"  ✓ {len(rules)} 条告警规则")

        # === 告警记录（制造一些未处理告警）===
        alerts = [
            AlertRecord(
                elder_id=elder1.id, alert_type="fall", alert_level="emergency",
                alert_message="检测到跌倒：张建国在主卧发生跌倒，请立即确认！",
                trigger_value="fall_duration=3s", rule_id=rules[0].id,
                handled_status=0, family_acknowledged=0,
                created_at=now - timedelta(hours=2),
            ),
            AlertRecord(
                elder_id=elder1.id, alert_type="inactivity", alert_level="warning",
                alert_message="张建国已超过 50 分钟未检测到活动，建议确认状态",
                handled_status=0, family_acknowledged=1, family_acknowledged_at=now - timedelta(hours=1),
                created_at=now - timedelta(hours=5),
            ),
            AlertRecord(
                elder_id=elder2.id, alert_type="device_offline", alert_level="info",
                alert_message="客厅摄像头离线，请检查设备状态",
                handled_status=0, family_acknowledged=0,
                created_at=now - timedelta(hours=30),
            ),
        ]
        db.add_all(alerts)
        db.flush()
        print(f"  ✓ {len(alerts)} 条告警记录（含已确认/未确认）")

        # === 最近 7 天日报 ===
        print("  正在生成 7 天日报...")
        for elder in [elder1, elder2]:
            for d in range(7):
                rd = date.today() - timedelta(days=d)
                avg_hr = random.randint(60, 80)
                fall = 1 if (elder.id == elder1.id and d == 1) else 0
                daily = DailyReport(
                    elder_id=elder.id, report_date=rd,
                    avg_heart_rate=avg_hr, avg_breath_rate=random.randint(15, 19),
                    sleep_hours=round(random.uniform(6, 9), 1),
                    toilet_count=random.randint(2, 5),
                    inout_count=random.randint(0, 4),
                    fall_count=fall,
                    alert_count=1 if d < 3 else 0,
                    ai_summary=(
                        f"今日整体平稳。心率平均 {avg_hr}，呼吸 {random.randint(15,19)}，"
                        f"睡眠 {round(random.uniform(6,9),1)} 小时。"
                        f"{'未发现异常。' if fall == 0 else '检测到跌倒事件，请注意。'}"
                    ),
                    data_count=random.randint(200, 288),
                )
                db.add(daily)
        db.flush()
        print("  ✓ 7 天日报已写入")

        # === 绑定码 ===
        bc = BindCode(
            bind_code="A1B2C3", elderly_id=elder1.id, relation="子女",
            generated_by=1, expire_at=now + timedelta(days=7),
        )
        db.add(bc)
        db.flush()
        print(f"  ✓ 绑定码: A1B2C3 → {elder1.name}")

        db.commit()

        # === 总结 ===
        print("\n" + "=" * 60)
        print("✅ 初始化完成！")
        print("=" * 60)
        print(f"\n  家属 familyId: {family.id}")
        print(f"  老人: {elder1.name}(主卧), {elder2.name}(次卧)")
        print(f"  设备: {len(devices)} 台")
        print(f"  告警: {len(alerts)} 条（含未处理紧急告警）")
        print(f"  绑定码: A1B2C3")
        print("\n  👉 后端会自动读取数据库，无需重启")
        print("  👉 小程序打开后直接就能看到卡片、告警、报告数据")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ 初始化失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    init()
