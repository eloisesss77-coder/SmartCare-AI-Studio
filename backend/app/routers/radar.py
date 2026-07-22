import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import RadarDevice, RadarData, Elderly, User
from app.schemas import (
    RadarDataReceive, RadarDataResponse, RadarDeviceResponse,
    ApiResponse, PaginatedData,
)
from app.services.radar_service import process_radar_data
from app.dependencies.auth import get_current_user, get_user_elderly_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/radar", tags=["雷达管理"])


@router.get("/data", response_model=ApiResponse)
def list_radar_data(
    page: int = Query(1, ge=1, alias="page", description="页码"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="每页数量"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """雷达数据列表(分页)"""
    query = db.query(RadarData)

    # 权限过滤：caregiver 只能看到分配老人的雷达数据
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(RadarData.elder_id.in_(elderly_ids))

    total = query.count()
    items = (
        query.order_by(RadarData.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApiResponse(
        data=PaginatedData(
            list=[RadarDataResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.post("/data", response_model=ApiResponse)
def receive_radar_data(req: RadarDataReceive, db: Session = Depends(get_db)):
    """接收雷达上报数据"""
    try:
        # 如果传了 device_sn, 查找对应的 device_id
        device_id = req.device_id
        if not device_id and req.device_sn:
            device = db.query(RadarDevice).filter(RadarDevice.device_sn == req.device_sn).first()
            if device:
                device_id = device.id

        if not device_id:
            raise HTTPException(status_code=400, detail="device_id 或 device_sn 不能为空")

        # 更新设备心跳
        device = db.query(RadarDevice).filter(RadarDevice.id == device_id).first()
        if device:
            device.online_status = 1
            device.last_heartbeat = datetime.now()

        # 确定 elder_id
        elder_id = req.elder_id
        if not elder_id:
            elderly = db.query(Elderly).filter(Elderly.radar_device_id == device_id).first()
            if elderly:
                elder_id = elderly.id

        # 创建雷达数据记录
        radar_data = RadarData(
            device_id=device_id,
            elder_id=elder_id,
            fall_status=req.fall_status or 0,
            heart_rate=req.heart_rate,
            breath_rate=req.breath_rate,
            activity_level=req.activity_level or "",
            in_bed=req.in_bed or 0,
            body_posture=req.body_posture or "",
            raw_json=req.raw_json or "",
            timestamp=req.timestamp or datetime.now(),
        )
        db.add(radar_data)
        db.commit()
        db.refresh(radar_data)

        # 异步处理：异常检测和告警
        process_radar_data(db, radar_data)

        return ApiResponse(
            message="数据接收成功",
            data=RadarDataResponse.model_validate(radar_data),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"接收雷达数据失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"数据处理失败: {str(e)}")


@router.get("/devices", response_model=ApiResponse)
def list_devices(
    page: int = Query(1, ge=1, alias="page", description="页码"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="每页数量"),
    online_status: Optional[int] = Query(None, alias="onlineStatus", description="在线状态"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """雷达设备列表"""
    query = db.query(RadarDevice)
    if online_status is not None:
        query = query.filter(RadarDevice.online_status == online_status)

    total = query.count()
    items = query.order_by(RadarDevice.id.asc()).offset((page - 1) * page_size).limit(page_size).all()

    return ApiResponse(
        data=PaginatedData(
            list=[RadarDeviceResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/devices/{device_id}/status", response_model=ApiResponse)
def get_device_status(
    device_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """设备在线状态"""
    device = db.query(RadarDevice).filter(RadarDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="设备不存在")

    return ApiResponse(
        data={
            "deviceId": device.id,
            "deviceSn": device.device_sn,
            "deviceName": device.device_name,
            "onlineStatus": device.online_status,
            "lastHeartbeat": str(device.last_heartbeat) if device.last_heartbeat else None,
        }
    )


@router.get("/data/history", response_model=ApiResponse)
def get_radar_data_history(
    elder_id: Optional[int] = Query(None, alias="elderId", description="老人ID"),
    start: Optional[str] = Query(None, alias="start", description="开始时间"),
    end: Optional[str] = Query(None, alias="end", description="结束时间"),
    page: int = Query(1, ge=1, alias="page", description="页码"),
    page_size: int = Query(20, ge=1, le=200, alias="pageSize", description="每页数量"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """历史雷达数据"""
    elderly_ids = get_user_elderly_ids(user, db)

    query = db.query(RadarData)
    if elder_id:
        # caregiver 只能看自己负责的老人
        if elderly_ids and elder_id not in elderly_ids:
            raise HTTPException(status_code=403, detail="无权查看该老人的数据")
        query = query.filter(RadarData.elder_id == elder_id)
    elif elderly_ids:
        query = query.filter(RadarData.elder_id.in_(elderly_ids))

    if start:
        query = query.filter(RadarData.timestamp >= start)
    if end:
        query = query.filter(RadarData.timestamp <= end)

    total = query.count()
    items = (
        query.order_by(RadarData.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApiResponse(
        data=PaginatedData(
            list=[RadarDataResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )
