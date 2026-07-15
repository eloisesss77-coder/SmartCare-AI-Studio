from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, DateTime, Date,
    Float, ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class Elderly(Base):
    """老人信息表"""
    __tablename__ = "t_elderly"
    __table_args__ = {"comment": "老人信息表"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    name = Column(String(50), nullable=False, comment="老人姓名")
    age = Column(Integer, default=0, comment="年龄")
    gender = Column(Integer, default=0, comment="性别: 0未知, 1男, 2女")
    room_no = Column(String(20), default="", comment="房间号")
    medical_history = Column(Text, comment="既往病史")
    emergency_contact = Column(String(50), default="", comment="紧急联系人")
    emergency_phone = Column(String(20), default="", comment="紧急联系电话")
    institution_id = Column(BigInteger, default=0, comment="所属机构ID")
    radar_device_id = Column(BigInteger, default=None, nullable=True, comment="绑定的雷达设备ID")
    status = Column(Integer, default=1, comment="状态: 0禁用, 1启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")


# ================================================================
# 通用设备表（整合8种设备类型）
# ================================================================

class DeviceGeneric(Base):
    """通用设备表 — 统一管理雷达/红外/门磁/摄像头/SOS/烟雾/煤气"""
    __tablename__ = "t_device_generic"
    __table_args__ = (
        Index("idx_device_sn", "device_sn"),
        Index("idx_institution", "institution_id"),
        Index("idx_category", "device_category"),
        {"comment": "通用设备表"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    device_sn = Column(String(64), nullable=False, unique=True, comment="设备序列号")
    device_name = Column(String(100), default="", comment="设备名称")
    device_category = Column(String(30), nullable=False, comment=(
        "设备大类: radar_fall(卫生间跌倒雷达), radar_bedside(床头心率雷达), "
        "infrared(红外探测器), door_magnet(门磁), camera(摄像头), "
        "sos_button(呼叫按钮), smoke_detector(烟雾报警), gas_detector(煤气报警)"
    ))
    device_brand = Column(String(50), default="", comment="品牌")
    device_model = Column(String(50), default="", comment="型号")
    room_no = Column(String(20), default="", comment="安装房间号")
    elder_id = Column(BigInteger, default=None, nullable=True, comment="关联老人ID")
    institution_id = Column(BigInteger, default=0, comment="所属机构ID")
    online_status = Column(Integer, default=0, comment="在线状态: 0离线, 1在线")
    battery_level = Column(Integer, default=None, nullable=True, comment="电量百分比")
    signal_strength = Column(Integer, default=None, nullable=True, comment="信号强度(dBm)")
    last_heartbeat = Column(DateTime, default=None, comment="最后心跳时间")
    extra_config = Column(Text, comment="扩展配置(JSON格式: 灵敏度/RTSP地址/电磁阀状态等)")
    status = Column(Integer, default=1, comment="状态: 0禁用, 1启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


# ================================================================
# 家属绑定码表
# ================================================================

class BindCode(Base):
    """家属绑定码表 — 管理端生成，家属在小程序扫码绑定"""
    __tablename__ = "t_bind_code"
    __table_args__ = (
        Index("idx_bind_code", "bind_code"),
        {"comment": "家属绑定码表"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    bind_code = Column(String(20), nullable=False, unique=True, comment="6位绑定码")
    elderly_id = Column(BigInteger, nullable=False, comment="被绑定的老人ID")
    relation = Column(String(20), default="子女", comment="预设关系")
    generated_by = Column(BigInteger, nullable=False, comment="生成者(管理端用户ID)")
    is_used = Column(Integer, default=0, comment="是否已使用: 0未使用, 1已使用")
    used_by_family_id = Column(BigInteger, default=None, nullable=True, comment="使用者家属ID")
    expire_at = Column(DateTime, nullable=False, comment="过期时间(24小时后)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")

    radar_device = relationship("RadarDevice", foreign_keys=[radar_device_id], primaryjoin="Elderly.radar_device_id == RadarDevice.id", lazy="select")


class RadarDevice(Base):
    """雷达设备表"""
    __tablename__ = "t_radar_device"
    __table_args__ = {"comment": "雷达设备表"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    device_sn = Column(String(64), nullable=False, unique=True, comment="设备序列号")
    device_name = Column(String(100), default="", comment="设备名称")
    device_type = Column(String(50), default="millimeter_wave", comment="设备类型")
    room_no = Column(String(20), default="", comment="安装房间号")
    mqtt_topic = Column(String(200), default="", comment="MQTT订阅主题")
    ip_address = Column(String(50), default="", comment="设备IP地址")
    firmware_version = Column(String(30), default="", comment="固件版本")
    online_status = Column(Integer, default=0, comment="在线状态: 0离线, 1在线")
    last_heartbeat = Column(DateTime, default=None, comment="最后心跳时间")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class RadarData(Base):
    """雷达原始数据表"""
    __tablename__ = "t_radar_data"

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    device_id = Column(BigInteger, nullable=False, comment="雷达设备ID")
    elder_id = Column(BigInteger, default=None, nullable=True, comment="关联老人ID")
    fall_status = Column(Integer, default=0, comment="跌倒状态: 0正常, 1跌倒")
    heart_rate = Column(Integer, default=None, nullable=True, comment="心率(次/分钟)")
    breath_rate = Column(Integer, default=None, nullable=True, comment="呼吸率(次/分钟)")
    activity_level = Column(String(20), default="", comment="活动等级: stationary/slight/moderate/vigorous")
    in_bed = Column(Integer, default=0, comment="是否在床: 0不在床, 1在床")
    body_posture = Column(String(30), default="", comment="体态: lying/sitting/standing/walking")
    raw_json = Column(Text, comment="原始JSON数据")
    timestamp = Column(DateTime, nullable=False, comment="数据采集时间戳")
    created_at = Column(DateTime, default=datetime.now, comment="记录创建时间")

    __table_args__ = (
        Index("idx_device_id", "device_id"),
        Index("idx_elder_id", "elder_id"),
        Index("idx_timestamp", "timestamp"),
        Index("idx_fall_status", "fall_status"),
        {"comment": "雷达原始数据表"},
    )


class AlertRule(Base):
    """告警规则表"""
    __tablename__ = "t_alert_rule"
    __table_args__ = {"comment": "告警规则表"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    rule_name = Column(String(100), nullable=False, comment="规则名称")
    rule_type = Column(String(50), nullable=False, comment="规则类型: fall/heart_rate/breath_rate/out_of_bed/inactivity")
    elder_id = Column(BigInteger, default=None, nullable=True, comment="关联老人ID(NULL表示全局规则)")
    threshold_value = Column(String(100), nullable=False, comment="阈值(JSON格式)")
    severity = Column(String(20), default="warning", comment="严重级别: info/warning/critical/emergency")
    enabled = Column(Integer, default=1, comment="是否启用: 0禁用, 1启用")
    notify_channels = Column(String(200), default="", comment="通知渠道(逗号分隔: dingtalk,wecom,sms)")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class AlertRecord(Base):
    """告警记录表"""
    __tablename__ = "t_alert_record"
    __table_args__ = {"comment": "告警记录表"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    elder_id = Column(BigInteger, default=None, nullable=True, comment="关联老人ID")
    device_id = Column(BigInteger, default=None, nullable=True, comment="关联设备ID")
    alert_type = Column(String(50), nullable=False, comment="告警类型")
    alert_level = Column(String(20), nullable=False, default="warning", comment="告警级别: info/warning/critical/emergency")
    alert_message = Column(String(500), nullable=False, comment="告警消息内容")
    trigger_value = Column(String(100), default="", comment="触发时的数值")
    rule_id = Column(BigInteger, default=None, nullable=True, comment="触发的规则ID")
    handled_status = Column(Integer, default=0, comment="处理状态: 0未处理, 1处理中, 2已处理")
    handled_by = Column(String(50), default="", comment="处理人")
    handled_at = Column(DateTime, default=None, comment="处理时间")
    handle_remark = Column(String(500), default="", comment="处理备注")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    elder = relationship("Elderly", foreign_keys=[elder_id], primaryjoin="AlertRecord.elder_id == Elderly.id", lazy="joined")


class DashboardStats(Base):
    """Dashboard统计表"""
    __tablename__ = "t_dashboard_stats"
    __table_args__ = (
        UniqueConstraint("institution_id", "stat_date"),
        {"comment": "Dashboard统计表"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    institution_id = Column(BigInteger, nullable=False, comment="机构ID")
    total_elderly = Column(Integer, default=0, comment="老人总数")
    online_devices = Column(Integer, default=0, comment="在线设备数")
    active_alerts = Column(Integer, default=0, comment="活跃告警数")
    fall_count_today = Column(Integer, default=0, comment="今日跌倒次数")
    stat_date = Column(Date, nullable=False, comment="统计日期")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")


class User(Base):
    """用户表"""
    __tablename__ = "t_user"
    __table_args__ = {"comment": "用户表"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    username = Column(String(50), unique=True, nullable=False, comment="用户名/手机号")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    display_name = Column(String(50), default="", comment="显示姓名")
    role = Column(String(20), nullable=False, comment="角色: admin/caregiver/super_admin")
    institution_id = Column(BigInteger, default=0, comment="所属机构ID")
    phone = Column(String(20), default="", comment="手机号")
    status = Column(Integer, default=1, comment="状态: 0禁用, 1启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class CaregiverElderly(Base):
    """护理员-老人分配关系表"""
    __tablename__ = "t_caregiver_elderly"
    __table_args__ = (
        UniqueConstraint("caregiver_id", "elderly_id"),
        {"comment": "护理员-老人分配关系表"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    caregiver_id = Column(BigInteger, nullable=False, comment="护理员用户ID")
    elderly_id = Column(BigInteger, nullable=False, comment="老人ID")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")


class Family(Base):
    """家属账号表（关联微信小程序openid）"""
    __tablename__ = "t_family"
    __table_args__ = {"comment": "家属账号表"}

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    openid = Column(String(100), unique=True, nullable=False, comment="微信小程序openid")
    unionid = Column(String(100), default="", comment="微信unionid")
    nickname = Column(String(50), default="", comment="微信昵称")
    avatar_url = Column(String(500), default="", comment="头像URL")
    phone = Column(String(20), default="", comment="手机号")
    status = Column(Integer, default=1, comment="状态: 0禁用, 1启用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class FamilyElderly(Base):
    """家属-老人绑定关系表"""
    __tablename__ = "t_family_elderly"
    __table_args__ = (
        UniqueConstraint("family_id", "elderly_id"),
        {"comment": "家属-老人绑定关系表"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True, comment="主键ID")
    family_id = Column(BigInteger, nullable=False, comment="家属账号ID")
    elderly_id = Column(BigInteger, nullable=False, comment="老人ID")
    relation = Column(String(20), default="", comment="关系: 子女/配偶/亲属等")
    is_primary = Column(Integer, default=0, comment="是否主监护人: 0否, 1是")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
