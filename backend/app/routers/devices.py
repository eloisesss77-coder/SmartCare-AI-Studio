"""通用设备管理路由：注册/列表/更新/数据上报/指令下发"""
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DeviceGeneric, Elderly, User
from app.schemas import (
    ApiResponse, PaginatedData,
    DeviceGenericCreate, DeviceGenericUpdate,
    DeviceGenericResponse, DeviceDataReport,
)
from app.dependencies.auth import get_current_user
from app.services.device_action import handle_device_data, send_device_command

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/devices", tags=["设备管理"])

# 设备大类中文标签
CATEGORY_LABELS: dict[str, str] = {
    "radar_fall": "卫生间跌倒雷达",
    "radar_bedside": "床头心率雷达",
    "infrared": "红外探测器",
    "door_magnet": "门口磁开关",
    "camera": "360°摄像头",
    "sos_button": "呼叫按钮",
    "smoke_detector": "烟雾报警器",
    "gas_detector": "煤气报警器",
}

CATEGORY_ICONS: dict[str, str] = {
    "radar_fall": "🚿",
    "radar_bedside": "🛏️",
    "infrared": "🛋️",
    "door_magnet": "🚪",
    "camera": "📷",
    "sos_button": "🆘",
    "smoke_detector": "🔥",
    "gas_detector": "⛽",
}


# ---------------------------------------------------------------
# 设备 CRUD
# ---------------------------------------------------------------

@router.post("", response_model=ApiResponse)
def register_device(
    req: DeviceGenericCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """注册新设备"""
    existing = db.query(DeviceGeneric).filter(DeviceGeneric.device_sn == req.device_sn).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"设备 {req.device_sn} 已存在")

    device = DeviceGeneric(
        device_sn=req.device_sn,
        device_name=req.device_name or f"{CATEGORY_LABELS.get(req.device_category, req.device_category)}-{req.device_sn[-4:]}",
        device_category=req.device_category,
        device_brand=req.device_brand or "",
        device_model=req.device_model or "",
        room_no=req.room_no or "",
        elder_id=req.elder_id,
        institution_id=req.institution_id or user.institution_id,
        extra_config=req.extra_config or "{}",
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    logger.info(f"设备注册成功: sn={req.device_sn}, category={req.device_category}")
    return ApiResponse(message="设备注册成功", data={"id": device.id, "deviceSn": device.device_sn})


@router.get("", response_model=ApiResponse)
def list_devices(
    page: int = Query(1, ge=1, alias="page"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    category: Optional[str] = Query(None, alias="category", description="设备大类筛选"),
    room_no: Optional[str] = Query(None, alias="roomNo", description="房间号筛选"),
    online_status: Optional[int] = Query(None, alias="onlineStatus", description="在线状态: 0/1"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """设备列表(分页+筛选)"""
    query = db.query(DeviceGeneric)

    # 租户隔离
    if user.role != "super_admin":
        query = query.filter(DeviceGeneric.institution_id == user.institution_id)

    if category:
        query = query.filter(DeviceGeneric.device_category == category)
    if room_no:
        query = query.filter(DeviceGeneric.room_no.like(f"%{room_no}%"))
    if online_status is not None:
        query = query.filter(DeviceGeneric.online_status == online_status)

    total = query.count()
    items = (
        query.order_by(DeviceGeneric.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # 填充老人姓名
    result = []
    for item in items:
        d = DeviceGenericResponse.model_validate(item)
        if item.elder_id:
            elder = db.query(Elderly).filter(Elderly.id == item.elder_id).first()
            if elder:
                d.elder_name = elder.name
        result.append(d)

    return ApiResponse(
        data=PaginatedData(list=result, total=total, page=page, page_size=page_size)
    )


@router.get("/categories", response_model=ApiResponse)
def get_device_categories():
    """获取所有设备大类（前端下拉选项用）"""
    cats = [
        {"value": k, "label": v, "icon": CATEGORY_ICONS.get(k, "")}
        for k, v in CATEGORY_LABELS.items()
    ]
    return ApiResponse(data=cats)


@router.get("/{device_id}", response_model=ApiResponse)
def get_device(
    device_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """设备详情"""
    device = db.query(DeviceGeneric).filter(DeviceGeneric.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")

    resp = DeviceGenericResponse.model_validate(device)
    if device.elder_id:
        elder = db.query(Elderly).filter(Elderly.id == device.elder_id).first()
        if elder:
            resp.elder_name = elder.name
    return ApiResponse(data=resp)


@router.put("/{device_id}", response_model=ApiResponse)
def update_device(
    device_id: int,
    req: DeviceGenericUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新设备信息"""
    device = db.query(DeviceGeneric).filter(DeviceGeneric.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")

    update_data = req.model_dump(exclude_unset=True)
    # 转换 extra_config 为 JSON 字符串
    if "extra_config" in update_data and update_data["extra_config"] is not None:
        if isinstance(update_data["extra_config"], dict):
            update_data["extra_config"] = json.dumps(update_data["extra_config"])

    for key, value in update_data.items():
        setattr(device, key, value)

    db.commit()
    db.refresh(device)
    logger.info(f"设备更新: id={device_id}")
    return ApiResponse(message="更新成功")


@router.delete("/{device_id}", response_model=ApiResponse)
def delete_device(
    device_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除设备"""
    device = db.query(DeviceGeneric).filter(DeviceGeneric.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")

    db.delete(device)
    db.commit()
    logger.info(f"设备删除: sn={device.device_sn}")
    return ApiResponse(message="设备已删除")


# ---------------------------------------------------------------
# 设备数据上报（NB-IoT / 网关）
# ---------------------------------------------------------------

@router.post("/data/report", response_model=ApiResponse)
def receive_device_data(
    req: DeviceDataReport,
    x_device_sn: Optional[str] = Header(None, alias="X-Device-SN"),
    x_device_type: Optional[str] = Header(None, alias="X-Device-Type"),
    db: Session = Depends(get_db),
):
    """
    设备数据统一上报入口

    支持两种上报方式：
    1. Header 中传 X-Device-SN + X-Device-Type（NB-IoT 直连）
    2. Body 中传 device_sn + device_category（网关转发）
    """
    device_sn = x_device_sn or req.device_sn
    device_category = x_device_type or req.device_category

    if not device_sn:
        raise HTTPException(status_code=400, detail="缺少设备序列号")

    device = db.query(DeviceGeneric).filter(DeviceGeneric.device_sn == device_sn).first()

    if not device:
        # 自动注册未知设备
        device = DeviceGeneric(
            device_sn=device_sn,
            device_name=f"自动注册-{device_sn[-6:]}",
            device_category=device_category or "unknown",
            online_status=1,
            last_heartbeat=datetime.now(),
        )
        db.add(device)
        db.commit()
        db.refresh(device)
        logger.info(f"自动注册设备: sn={device_sn}, category={device_category}")
    else:
        device.online_status = 1
        device.last_heartbeat = datetime.now()

        # 更新电量/信号
        if isinstance(req.data, dict):
            if "battery_level" in req.data:
                device.battery_level = req.data["battery_level"]
            if "signal_strength" in req.data:
                device.signal_strength = req.data["signal_strength"]

        db.commit()

    # 触发设备数据业务处理（告警判断、关阀联动等）
    handle_device_data(device, req.data, req.timestamp, db)

    return ApiResponse(message="数据接收成功")


# ---------------------------------------------------------------
# 设备指令下发
# ---------------------------------------------------------------

@router.post("/{device_id}/command", response_model=ApiResponse)
def send_command(
    device_id: int,
    command: dict = {},
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    向设备下发指令

    支持的指令：
    - gas_detector: {"action": "close_valve"}  关闭电磁阀
    - gas_detector: {"action": "open_valve"}   打开电磁阀
    - camera: {"action": "ptz", "angle": 90}   云台旋转
    """
    device = db.query(DeviceGeneric).filter(DeviceGeneric.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")

    success = send_device_command(device, command)
    if success:
        logger.info(f"指令下发成功: device={device.device_sn}, command={command}")
        return ApiResponse(message="指令已下发")
    else:
        raise HTTPException(status_code=500, detail="指令下发失败")


# ---------------------------------------------------------------
# 设备统计（Dashboard 用）
# ---------------------------------------------------------------

@router.get("/stats/summary", response_model=ApiResponse)
def device_stats_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """设备统计摘要：按分类统计在线/离线数量"""
    query = db.query(DeviceGeneric)
    if user.role != "super_admin":
        query = query.filter(DeviceGeneric.institution_id == user.institution_id)

    devices = query.all()

    categories: dict[str, dict] = {}
    for d in devices:
        cat = d.device_category
        if cat not in categories:
            categories[cat] = {
                "category": cat,
                "label": CATEGORY_LABELS.get(cat, cat),
                "icon": CATEGORY_ICONS.get(cat, ""),
                "total": 0,
                "online": 0,
                "offline": 0,
            }
        categories[cat]["total"] += 1
        if d.online_status == 1:
            categories[cat]["online"] += 1
        else:
            categories[cat]["offline"] += 1

    total_online = sum(1 for d in devices if d.online_status == 1)

    return ApiResponse(data={
        "totalDevices": len(devices),
        "onlineDevices": total_online,
        "offlineDevices": len(devices) - total_online,
        "byCategory": list(categories.values()),
    })
