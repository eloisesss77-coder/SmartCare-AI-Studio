"""
初始化脚本 - 创建 super_admin 账户和示例数据
运行方式: python -m scripts.init_admin  (在 backend 目录下执行)
"""
import sys
import os

# 确保 backend 目录在 sys.path 中
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User, CaregiverElderly, Elderly
from sqlalchemy import text


def init():
    print("=" * 50)
    print("SmartCare 初始化脚本")
    print("=" * 50)

    # 确保数据库表存在
    Base.metadata.create_all(bind=engine)
    print("✓ 数据库表检查/创建完成")

    db = SessionLocal()
    try:
        # --- 1. 检查并创建 super_admin ---
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            admin = User(
                username="admin",
                password_hash="admin123",
                display_name="系统管理员",
                role="super_admin",
                institution_id=0,
                phone="",
                status=1,
            )
            db.add(admin)
            db.commit()
            print(f"✓ 创建 super_admin: admin/admin123 (id={admin.id})")
        else:
            print(f"  super_admin 已存在 (id={existing_admin.id})，跳过")

        # --- 2. 修复 t_elderly 的 institution_id ---
        # 检查是否有 institution_id 为 0 或 NULL 的老人
        zero_count = db.query(Elderly).filter(Elderly.institution_id == 0).count()
        null_count = db.query(Elderly).filter(Elderly.institution_id.is_(None)).count()
        total = db.query(Elderly).count()

        if total > 0 and (zero_count == total or null_count > 0):
            db.execute(
                text("UPDATE t_elderly SET institution_id = 1 WHERE institution_id IS NULL OR institution_id = 0")
            )
            db.commit()
            print(f"✓ 已将 {total} 条老人记录的 institution_id 设置为 1")
        else:
            print(f"  t_elderly institution_id 状态正常，共 {total} 条记录")

        # --- 3. 创建示例 caregiver ---
        existing_caregiver = db.query(User).filter(User.username == "nurse1").first()
        if not existing_caregiver:
            caregiver = User(
                username="nurse1",
                password_hash="123456",
                display_name="张护工",
                role="caregiver",
                institution_id=1,
                phone="13800000001",
                status=1,
            )
            db.add(caregiver)
            db.commit()
            db.refresh(caregiver)
            print(f"✓ 创建 caregiver: nurse1/123456 (id={caregiver.id})")

            # --- 4. 为 caregiver 分配老人 id=2,3 ---
            for elder_id in [2, 3]:
                elder = db.query(Elderly).filter(Elderly.id == elder_id).first()
                if elder:
                    existing_rel = db.query(CaregiverElderly).filter(
                        CaregiverElderly.caregiver_id == caregiver.id,
                        CaregiverElderly.elderly_id == elder_id,
                    ).first()
                    if not existing_rel:
                        rel = CaregiverElderly(
                            caregiver_id=caregiver.id,
                            elderly_id=elder_id,
                        )
                        db.add(rel)
                        print(f"  ✓ 分配老人 id={elder_id} ({elder.name}) → 张护工")
                    else:
                        print(f"  分配关系已存在: caregiver={caregiver.id}, elderly={elder_id}")
                else:
                    print(f"  ⚠ 老人 id={elder_id} 不存在，跳过分配")
            db.commit()
        else:
            print(f"  caregiver nurse1 已存在 (id={existing_caregiver.id})，跳过")

        print("=" * 50)
        print("初始化完成！")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"✗ 错误: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init()
