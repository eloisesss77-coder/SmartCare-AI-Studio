import logging
from datetime import datetime, date, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from app.database import get_db
from app.models import Elderly, RadarDevice, AlertRecord, RadarData, User
from app.schemas import ApiResponse, DashboardOverview
from app.dependencies.auth import get_current_user, get_user_elderly_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=ApiResponse)
def get_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard 概览数据"""
    today = date.today()

    # 权限过滤：caregiver 只看自己负责的老人
    elderly_ids = get_user_elderly_ids(user, db)
    elderly_filter = Elderly.id.in_(elderly_ids) if elderly_ids else True

    total_elderly = db.query(func.count(Elderly.id)).filter(Elderly.status == 1, elderly_filter).scalar() or 0

    online_devices = db.query(func.count(RadarDevice.id)).filter(RadarDevice.online_status == 1).scalar() or 0

    alert_query = db.query(func.count(AlertRecord.id)).filter(AlertRecord.handled_status == 0)
    if elderly_ids:
        alert_query = alert_query.filter(AlertRecord.elder_id.in_(elderly_ids))
    active_alerts = alert_query.scalar() or 0

    fall_query = (
        db.query(func.count(AlertRecord.id))
        .filter(
            AlertRecord.alert_type == "fall",
            cast(AlertRecord.created_at, Date) == today,
        )
    )
    if elderly_ids:
        fall_query = fall_query.filter(AlertRecord.elder_id.in_(elderly_ids))
    fall_count_today = fall_query.scalar() or 0

    # 获取每个老人最新的雷达数据（子查询方式）
    from sqlalchemy import and_
    latest_radar_subq = (
        db.query(
            RadarData.elder_id,
            func.max(RadarData.id).label("max_id"),
        )
        .filter(RadarData.elder_id.isnot(None))
        .group_by(RadarData.elder_id)
        .subquery()
    )
    latest_radar = db.query(RadarData).join(
        latest_radar_subq,
        and_(
            RadarData.elder_id == latest_radar_subq.c.elder_id,
            RadarData.id == latest_radar_subq.c.max_id,
        ),
    ).all()
    radar_map = {rd.elder_id: rd for rd in latest_radar}

    # 各房间状态
    elders = (
        db.query(Elderly)
        .filter(Elderly.status == 1)
    )
    if elderly_ids:
        elders = elders.filter(Elderly.id.in_(elderly_ids))
    elders = elders.all()

    # 关联雷达设备在线状态
    device_ids = [e.radar_device_id for e in elders if e.radar_device_id]
    device_map = {}
    if device_ids:
        devices = db.query(RadarDevice).filter(RadarDevice.id.in_(device_ids)).all()
        device_map = {d.id: d for d in devices}

    room_status_list = []
    for elder in elders:
        rd = radar_map.get(elder.id)
        dev = device_map.get(elder.radar_device_id) if elder.radar_device_id else None
        room_status_list.append({
            "roomNo": elder.room_no,
            "elderlyName": elder.name,
            "deviceOnline": dev.online_status == 1 if dev else False,
            "online": dev.online_status == 1 if dev else False,
            "inBed": rd.in_bed if rd else 0,
            "heartRate": rd.heart_rate if rd else None,
            "fallStatus": rd.fall_status if rd else 0,
        })

    # 最近5条告警
    recent_alerts_q = db.query(AlertRecord).order_by(AlertRecord.created_at.desc()).limit(5)
    if elderly_ids:
        recent_alerts_q = recent_alerts_q.filter(AlertRecord.elder_id.in_(elderly_ids))
    recent = recent_alerts_q.all()
    recent_alerts = []
    for a in recent:
        elder_info = a.elder
        recent_alerts.append({
            "id": a.id,
            "alertType": a.alert_type,
            "alertLevel": a.alert_level,
            "alertMessage": a.alert_message,
            "handledStatus": a.handled_status,
            "createdAt": str(a.created_at) if a.created_at else None,
            "elderName": elder_info.name if elder_info else "",
            "roomNo": elder_info.room_no if elder_info else "",
        })

    return ApiResponse(
        data=DashboardOverview(
            total_elderly=total_elderly,
            online_devices=online_devices,
            active_alerts=active_alerts,
            fall_count_today=fall_count_today,
            room_status_list=room_status_list,
        )
    )


@router.get("/alert-trend", response_model=ApiResponse)
def get_alert_trend(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """告警趋势(最近30天) — 返回每天 total/fall/heartRate/breathRate"""
    thirty_days_ago = datetime.now() - timedelta(days=30)

    elderly_ids = get_user_elderly_ids(user, db)

    query = (
        db.query(
            cast(AlertRecord.created_at, Date).label("date"),
            AlertRecord.alert_type,
            func.count(AlertRecord.id).label("count"),
        )
        .filter(AlertRecord.created_at >= thirty_days_ago)
    )
    if elderly_ids:
        query = query.filter(AlertRecord.elder_id.in_(elderly_ids))

    records = (
        query.group_by(cast(AlertRecord.created_at, Date), AlertRecord.alert_type)
        .order_by(cast(AlertRecord.created_at, Date))
        .all()
    )

    # 按日期聚合
    day_map: dict = {}
    for r in records:
        d = str(r.date)
        if d not in day_map:
            day_map[d] = {"date": d, "total": 0, "fall": 0, "heartRate": 0, "breathRate": 0}
        day_map[d]["total"] += r.count
        if r.alert_type == "fall":
            day_map[d]["fall"] += r.count
        elif r.alert_type == "heart_rate":
            day_map[d]["heartRate"] += r.count
        elif r.alert_type == "breath_rate":
            day_map[d]["breathRate"] += r.count

    return ApiResponse(data=list(day_map.values()))


@router.get("/device-status", response_model=ApiResponse)
def get_device_status_distribution(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """设备状态分布"""
    total = db.query(func.count(RadarDevice.id)).scalar() or 0
    online = db.query(func.count(RadarDevice.id)).filter(RadarDevice.online_status == 1).scalar() or 0
    offline = total - online

    return ApiResponse(
        data={
            "total": total,
            "online": online,
            "offline": offline,
        }
    )
