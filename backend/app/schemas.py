from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from pydantic.alias_generators import to_camel


# ============================================================
# 通用响应
# ============================================================

class ApiResponse(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[object] = None


class PaginatedData(BaseModel):
    list: list
    total: int
    page: int
    page_size: int


# ============================================================
# Elderly 老人
# ============================================================

class ElderlyBase(BaseModel):
    name: str = Field(..., description="老人姓名")
    age: Optional[int] = Field(0, description="年龄")
    gender: Optional[int] = Field(0, description="性别: 0未知, 1男, 2女")
    room_no: Optional[str] = Field("", description="房间号")
    medical_history: Optional[str] = Field("", description="既往病史")
    emergency_contact: Optional[str] = Field("", description="紧急联系人")
    emergency_phone: Optional[str] = Field("", description="紧急联系电话")
    institution_id: Optional[int] = Field(0, description="所属机构ID")
    status: Optional[int] = Field(1, description="状态: 0禁用, 1启用")


class ElderlyCreate(ElderlyBase):
    pass


class ElderlyUpdate(BaseModel):
    name: Optional[str] = Field(None, description="老人姓名")
    age: Optional[int] = Field(None, description="年龄")
    gender: Optional[int] = Field(None, description="性别")
    room_no: Optional[str] = Field(None, description="房间号")
    medical_history: Optional[str] = Field(None, description="既往病史")
    emergency_contact: Optional[str] = Field(None, description="紧急联系人")
    emergency_phone: Optional[str] = Field(None, description="紧急联系电话")
    institution_id: Optional[int] = Field(None, description="所属机构ID")
    status: Optional[int] = Field(None, description="状态")


class ElderlyResponse(ElderlyBase):
    id: int
    radar_device_id: Optional[int] = None
    radar_device_sn: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class BindRadarRequest(BaseModel):
    radar_device_id: int = Field(..., description="雷达设备ID")


# ============================================================
# Radar 雷达
# ============================================================

class RadarDataReceive(BaseModel):
    device_sn: Optional[str] = Field(None, description="设备序列号")
    device_id: Optional[int] = Field(None, description="雷达设备ID")
    elder_id: Optional[int] = Field(None, description="关联老人ID")
    fall_status: Optional[int] = Field(0, description="跌倒状态")
    heart_rate: Optional[int] = Field(None, description="心率")
    breath_rate: Optional[int] = Field(None, description="呼吸率")
    activity_level: Optional[str] = Field("stationary", description="活动等级")
    in_bed: Optional[int] = Field(0, description="是否在床")
    body_posture: Optional[str] = Field("", description="体态")
    raw_json: Optional[str] = Field("", description="原始JSON")
    timestamp: Optional[datetime] = Field(None, description="数据采集时间戳")


class RadarDataResponse(BaseModel):
    id: int
    device_id: int
    elder_id: Optional[int] = None
    fall_status: int = 0
    heart_rate: Optional[int] = None
    breath_rate: Optional[int] = None
    activity_level: str = ""
    in_bed: int = 0
    body_posture: str = ""
    raw_json: Optional[str] = ""
    timestamp: datetime
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class RadarDeviceResponse(BaseModel):
    id: int
    device_sn: str
    device_name: str
    device_type: str
    room_no: str
    mqtt_topic: str
    ip_address: str
    firmware_version: str
    online_status: int
    last_heartbeat: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================
# Alert 告警
# ============================================================

class AlertRuleBase(BaseModel):
    rule_name: str = Field(..., description="规则名称")
    rule_type: str = Field(..., description="规则类型: fall/heart_rate/breath_rate/out_of_bed/inactivity")
    elder_id: Optional[int] = Field(None, description="关联老人ID")
    threshold_value: str = Field(..., description="阈值(JSON格式)")
    severity: Optional[str] = Field("warning", description="严重级别")
    enabled: Optional[int] = Field(1, description="是否启用")
    notify_channels: Optional[str] = Field("", description="通知渠道")


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(BaseModel):
    rule_name: Optional[str] = Field(None, description="规则名称")
    rule_type: Optional[str] = Field(None, description="规则类型")
    elder_id: Optional[int] = Field(None, description="关联老人ID")
    threshold_value: Optional[str] = Field(None, description="阈值")
    severity: Optional[str] = Field(None, description="严重级别")
    enabled: Optional[int] = Field(None, description="是否启用")
    notify_channels: Optional[str] = Field(None, description="通知渠道")


class AlertRuleResponse(AlertRuleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "alias_generator": to_camel,
    }


class HandleAlertRequest(BaseModel):
    handled_status: int = Field(1, alias="handledStatus")
    handled_by: str = Field("", alias="handledBy")
    handle_remark: Optional[str] = Field("", alias="handleRemark")

    class Config:
        populate_by_name = True


class AlertCreate(BaseModel):
    """从 Zabbix Webhook 创建告警"""
    source: Optional[str] = Field("zabbix", description="告警来源")
    host_name: Optional[str] = Field(None, description="主机名")
    elder_id: Optional[str] = Field(None, description="老人ID")
    elder_name: Optional[str] = Field(None, description="老人姓名")
    room_no: Optional[str] = Field(None, description="房间号")
    alert_type: str = Field("zabbix_trigger", description="告警类型")
    alert_level: int = Field(1, description="告警级别 1=提示 2=一般 3=重要 4=紧急")
    alert_message: str = Field("", description="告警消息")
    trigger_value: Optional[str] = Field(None, description="触发值")
    severity: Optional[str] = Field(None, description="严重程度标签")


class AlertRecordResponse(BaseModel):
    id: int
    elder_id: Optional[int] = None
    device_id: Optional[int] = None
    alert_type: str
    alert_level: str
    alert_message: str
    trigger_value: str = ""
    rule_id: Optional[int] = None
    handled_status: int = 0
    handled_by: str = ""
    handled_at: Optional[datetime] = None
    handle_remark: str = ""
    created_at: Optional[datetime] = None
    elder: Optional[ElderlyResponse] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


# ============================================================
# Auth 认证
# ============================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


# ============================================================
# User 用户管理
# ============================================================

class UserCreate(BaseModel):
    username: str
    password: str
    display_name: str = Field(..., alias="displayName")
    role: str = "caregiver"
    phone: str = ""
    elderly_ids: list[int] = Field(default_factory=list, alias="elderlyIds")

    class Config:
        populate_by_name = True


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, alias="displayName")
    role: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[int] = None
    elderly_ids: Optional[list[int]] = Field(None, alias="elderlyIds")

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    phone: str
    status: int
    institution_id: int
    elderly_ids: list[int] = []
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


# ============================================================
# Dashboard
# ============================================================

class DashboardOverview(BaseModel):
    total_elderly: int = 0
    online_devices: int = 0
    active_alerts: int = 0
    fall_count_today: int = 0
    room_status_list: List[dict] = []

    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class AlertTrendItem(BaseModel):
    date: str
    count: int
    level: str


class DeviceStatusDistribution(BaseModel):
    online: int = 0
    offline: int = 0
    total: int = 0


# ============================================================
# Family 家属
# ============================================================

class FamilyCreate(BaseModel):
    """家属注册/绑定请求（来自小程序）"""
    openid: str = Field(..., description="微信小程序openid")
    unionid: Optional[str] = Field("", description="微信unionid")
    nickname: Optional[str] = Field("", description="微信昵称")
    avatar_url: Optional[str] = Field("", alias="avatarUrl", description="头像URL")
    phone: Optional[str] = Field("", description="手机号")

    class Config:
        populate_by_name = True


class FamilyBindElderly(BaseModel):
    """家属绑定老人请求"""
    elderly_id: int = Field(..., alias="elderlyId", description="老人ID")
    relation: str = Field("子女", description="与老人关系")
    is_primary: int = Field(0, alias="isPrimary", description="是否主监护人")

    class Config:
        populate_by_name = True


class FamilyResponse(BaseModel):
    id: int
    openid: str
    nickname: str = ""
    avatar_url: str = ""
    phone: str = ""
    status: int = 1
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class FamilyElderlyResponse(BaseModel):
    id: int
    family_id: int
    elderly_id: int
    relation: str = ""
    is_primary: int = 0
    elderly_name: str = ""
    room_no: str = ""
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


# ============================================================
# 通用设备管理
# ============================================================

class DeviceGenericCreate(BaseModel):
    """注册新设备"""
    device_sn: str = Field(..., description="设备序列号")
    device_name: str = Field("", description="设备名称")
    device_category: str = Field(..., description="设备大类: radar_fall/radar_bedside/infrared/door_magnet/camera/sos_button/smoke_detector/gas_detector")
    device_brand: str = Field("", description="品牌")
    device_model: str = Field("", description="型号")
    room_no: str = Field("", description="安装房间号")
    elder_id: Optional[int] = Field(None, description="关联老人ID")
    institution_id: Optional[int] = Field(0, description="所属机构ID")
    extra_config: Optional[str] = Field("", description="扩展配置JSON")

    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class DeviceGenericUpdate(BaseModel):
    """更新设备信息"""
    device_name: Optional[str] = Field(None, description="设备名称")
    room_no: Optional[str] = Field(None, description="安装房间号")
    elder_id: Optional[int] = Field(None, description="关联老人ID")
    extra_config: Optional[str] = Field(None, description="扩展配置JSON")
    status: Optional[int] = Field(None, description="状态")

    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class DeviceGenericResponse(BaseModel):
    """设备信息响应"""
    id: int
    device_sn: str
    device_name: str
    device_category: str
    device_brand: str = ""
    device_model: str = ""
    room_no: str = ""
    elder_id: Optional[int] = None
    elder_name: str = ""
    institution_id: int = 0
    online_status: int = 0
    battery_level: Optional[int] = None
    signal_strength: Optional[int] = None
    last_heartbeat: Optional[datetime] = None
    extra_config: str = ""
    status: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


class DeviceDataReport(BaseModel):
    """设备数据上报（NB-IoT 直连 或 网关转发）"""
    device_sn: str = Field(..., description="设备序列号")
    device_category: Optional[str] = Field(None, description="设备大类")
    timestamp: Optional[datetime] = Field(None, description="采集时间戳")
    data: dict = Field(..., description="设备原始数据")

    model_config = {
        "alias_generator": to_camel,
        "populate_by_name": True,
    }


# ============================================================
# 家属绑定码
# ============================================================

class GenerateBindCodeRequest(BaseModel):
    """管理端生成绑定码"""
    elderly_id: int = Field(..., alias="elderlyId")
    relation: str = Field("子女", description="预设关系")


class UseBindCodeRequest(BaseModel):
    """小程序端使用绑定码"""
    bind_code: str = Field(..., alias="bindCode")
    relation: str = Field("子女", description="关系")


class BindCodeResponse(BaseModel):
    id: int
    bind_code: str
    elderly_id: int
    elderly_name: str = ""
    room_no: str = ""
    relation: str = ""
    is_used: int = 0
    expire_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "alias_generator": to_camel,
        "populate_by_name": True,
    }
