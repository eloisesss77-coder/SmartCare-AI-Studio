"""数据模型 —— 按原型需求重构，支持完整 SaaS 权限链路"""
from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, DateTime, Date, JSON,
    Float, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


# ================================================================
# 老人
# ================================================================
class Elderly(Base):
    """老人信息表"""
    __tablename__ = "t_elderly"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, comment="老人姓名")
    age = Column(Integer, default=0, comment="年龄")
    gender = Column(Integer, default=0, comment="性别: 0未知, 1男, 2女")
    room_no = Column(String(20), default="", comment="房间号")
    medical_history = Column(Text, comment="既往病史")
    emergency_contact = Column(String(50), default="", comment="紧急联系人")
    emergency_phone = Column(String(20), default="", comment="紧急联系电话")
    family_id = Column(BigInteger, default=None, nullable=True, comment="所属家庭ID")
    institution_id = Column(BigInteger, default=0, comment="所属机构ID")
    radar_device_id = Column(BigInteger, default=None, nullable=True, comment="绑定的雷达设备ID")
    status = Column(Integer, default=1, comment="状态: 0禁用, 1启用")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    radar_device = relationship("RadarDevice", foreign_keys=[radar_device_id], lazy="select")


# ================================================================
# 通用设备（雷达/门磁/摄像头/SOS/烟雾/煤气/红外）
# ================================================================
class DeviceGeneric(Base):
    __tablename__ = "t_device_generic"
    __table_args__ = (
        Index("idx_device_sn", "device_sn"),
        Index("idx_elder", "elder_id"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    device_sn = Column(String(64), nullable=False, unique=True, comment="设备序列号")
    device_name = Column(String(100), default="", comment="设备名称")
    device_category = Column(String(30), nullable=False, comment=(
        "radar_bedhead(床头睡眠雷达), radar_bath(卫生间雷达), radar_living(客厅壁挂雷达), "
        "door_magnet(门磁), camera(摄像头), sos_button, smoke_detector, gas_detector, infrared"
    ))
    device_brand = Column(String(50), default="", comment="品牌")
    device_model = Column(String(50), default="", comment="型号")
    room_no = Column(String(20), default="", comment="安装房间号")
    elder_id = Column(BigInteger, default=None, nullable=True, comment="关联老人ID")
    online_status = Column(Integer, default=0, comment="0离线, 1在线")
    battery_level = Column(Integer, default=None, nullable=True, comment="电量%")
    last_heartbeat = Column(DateTime, default=None, comment="最后心跳时间")
    status = Column(Integer, default=1, comment="0禁用, 1启用")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class RadarDevice(Base):
    __tablename__ = "t_radar_device"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    device_sn = Column(String(64), nullable=False, unique=True)
    device_name = Column(String(100), default="")
    device_type = Column(String(50), default="millimeter_wave")
    room_no = Column(String(20), default="")
    online_status = Column(Integer, default=0, comment="0离线, 1在线")
    last_heartbeat = Column(DateTime, default=None)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class RadarData(Base):
    __tablename__ = "t_radar_data"
    __table_args__ = (
        Index("idx_device", "device_id"),
        Index("idx_elder_time", "elder_id", "timestamp"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    device_id = Column(BigInteger, nullable=False)
    elder_id = Column(BigInteger, default=None, nullable=True)
    fall_status = Column(Integer, default=0, comment="0正常, 1跌倒")
    heart_rate = Column(Integer, default=None, nullable=True)
    breath_rate = Column(Integer, default=None, nullable=True)
    activity_level = Column(String(20), default="", comment="stationary/slight/moderate/vigorous")
    in_bed = Column(Integer, default=0, comment="0不在床, 1在床")
    body_posture = Column(String(30), default="", comment="lying/sitting/standing/walking")
    timestamp = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


# ================================================================
# 告警系统
# ================================================================
class AlertRule(Base):
    __tablename__ = "t_alert_rule"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False, comment="fall/heart_rate/breath_rate/inactivity/out_of_bed/device_offline")
    elder_id = Column(BigInteger, default=None, nullable=True)
    threshold_value = Column(String(100), nullable=False, comment="JSON")
    severity = Column(String(20), default="warning", comment="info/warning/critical/emergency")
    enabled = Column(Integer, default=1)
    notify_channels = Column(String(200), default="")
    created_at = Column(DateTime, default=datetime.now)


class AlertRecord(Base):
    """告警记录 —— 加了家属确认字段"""
    __tablename__ = "t_alert_record"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    elder_id = Column(BigInteger, default=None, nullable=True)
    device_id = Column(BigInteger, default=None, nullable=True)
    alert_type = Column(String(50), nullable=False)
    alert_level = Column(String(20), default="warning")
    alert_message = Column(String(500), nullable=False)
    trigger_value = Column(String(100), default="")
    rule_id = Column(BigInteger, default=None, nullable=True)
    handled_status = Column(Integer, default=0, comment="0未处理, 2已处理")
    handled_by = Column(String(50), default="", comment="护理端处理人")
    handled_at = Column(DateTime, default=None)
    handle_remark = Column(String(500), default="")
    # 家属端字段 —— 原型新增
    family_acknowledged = Column(Integer, default=0, comment="家属是否已确认安全: 0否, 1是")
    family_acknowledged_by = Column(BigInteger, default=None, nullable=True, comment="确认的家属ID")
    family_acknowledged_at = Column(DateTime, default=None)
    created_at = Column(DateTime, default=datetime.now)


# ================================================================
# 健康日报（AI 摘要）
# ================================================================
class DailyReport(Base):
    """每日健康报告 —— 原型核心"""
    __tablename__ = "t_daily_report"
    __table_args__ = (UniqueConstraint("elder_id", "report_date"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    elder_id = Column(BigInteger, nullable=False)
    report_date = Column(Date, nullable=False)
    avg_heart_rate = Column(Integer, default=None, nullable=True)
    avg_breath_rate = Column(Integer, default=None, nullable=True)
    sleep_hours = Column(Float, default=None, nullable=True, comment="睡眠总时长(小时)")
    toilet_count = Column(Integer, default=0, comment="如厕次数")
    inout_count = Column(Integer, default=0, comment="出入次数")
    fall_count = Column(Integer, default=0, comment="跌倒次数")
    alert_count = Column(Integer, default=0, comment="告警次数")
    activity_hours = Column(Float, default=None, nullable=True, comment="白天活动总时长(小时)")
    ai_summary = Column(Text, comment="AI 健康摘要")
    data_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)


# ================================================================
# 家庭 & 成员权限模型（原型核心重构）
# ================================================================
class Family(Base):
    """家属账号 = 家庭概念（原型里「家庭A」就是一个 Family）"""
    __tablename__ = "t_family"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    openid = Column(String(100), unique=True, nullable=False)
    unionid = Column(String(100), default="")
    nickname = Column(String(50), default="")
    avatar_url = Column(String(500), default="")
    phone = Column(String(20), default="")
    # 原型新增：家庭信息
    family_name = Column(String(100), default="", comment="家庭名称，如「家庭A」")
    family_role = Column(String(20), default="member", comment="在家庭中的角色: admin/member")
    # 原型新增：4 个通知开关
    notification_settings = Column(JSON, default=lambda: {
        "wechat_enabled": True,
        "alert_fall": True,
        "alert_abnormal": True,
        "daily_report": True,
        "weekly_report": True,
    }, comment="通知开关JSON")
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class FamilyElderly(Base):
    """家属-老人绑定 —— 加角色字段"""
    __tablename__ = "t_family_elderly"
    __table_args__ = (UniqueConstraint("family_id", "elderly_id"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    family_id = Column(BigInteger, nullable=False)
    elderly_id = Column(BigInteger, nullable=False)
    relation = Column(String(20), default="子女")
    elder_role = Column(String(20), default="viewer", comment="对该老人的权限: admin/viewer")
    is_primary = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)


# ================================================================
# 绑定码（保留，兼容管理端生成）
# ================================================================
class BindCode(Base):
    __tablename__ = "t_bind_code"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    bind_code = Column(String(20), nullable=False, unique=True)
    elderly_id = Column(BigInteger, nullable=False)
    relation = Column(String(20), default="子女")
    generated_by = Column(BigInteger, nullable=False)
    is_used = Column(Integer, default=0)
    used_by_family_id = Column(BigInteger, default=None, nullable=True)
    expire_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


# ================================================================
# 管理端（保留，Web 管理后台用）
# ================================================================
class User(Base):
    """管理端用户（护理员/管理员）"""
    __tablename__ = "t_user"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(50), default="")
    role = Column(String(20), default="caregiver", comment="admin/caregiver")
    institution_id = Column(BigInteger, default=0)
    phone = Column(String(20), default="")
    status = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.now)


class CaregiverElderly(Base):
    """护理员-老人分配（管理端）"""
    __tablename__ = "t_caregiver_elderly"
    __table_args__ = (UniqueConstraint("caregiver_id", "elderly_id"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    caregiver_id = Column(BigInteger, nullable=False, comment="护理员User.id")
    elderly_id = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, default=datetime.now)


class DashboardStats(Base):
    __tablename__ = "t_dashboard_stats"
    __table_args__ = (UniqueConstraint("institution_id", "stat_date"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    institution_id = Column(BigInteger, nullable=False)
    total_elderly = Column(Integer, default=0)
    online_devices = Column(Integer, default=0)
    active_alerts = Column(Integer, default=0)
    fall_count_today = Column(Integer, default=0)
    stat_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
