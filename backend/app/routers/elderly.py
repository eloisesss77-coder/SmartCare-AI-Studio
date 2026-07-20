from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, case
from typing import Optional
from datetime import datetime, timedelta, date

from app.database import get_db
from app.models import Elderly, RadarDevice, RadarData, User, AlertRecord
from app.schemas import (
    ElderlyCreate, ElderlyUpdate, ElderlyResponse,
    BindRadarRequest, RadarDataResponse,
    ApiResponse, PaginatedData,
)
from app.dependencies.auth import get_current_user, get_user_elderly_ids

router = APIRouter(prefix="/api/v1/elderly", tags=["老人管理"])


def _elderly_to_response(elderly: Elderly) -> ElderlyResponse:
    resp = ElderlyResponse.model_validate(elderly)
    resp.radar_device_sn = elderly.radar_device.device_sn if elderly.radar_device else ""
    return resp


@router.get("", response_model=ApiResponse)
def list_elderly(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="搜索关键词(姓名/房间号)"),
    status: Optional[int] = Query(None, description="状态筛选"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """老人列表(分页+搜索)"""
    query = db.query(Elderly)
    if keyword:
        query = query.filter(
            or_(
                Elderly.name.like(f"%{keyword}%"),
                Elderly.room_no.like(f"%{keyword}%"),
            )
        )
    if status is not None:
        query = query.filter(Elderly.status == status)

    # 权限过滤：caregiver 只能看到分配的老人
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(Elderly.id.in_(elderly_ids))

    total = query.count()
    items = query.order_by(Elderly.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return ApiResponse(
        data=PaginatedData(
            list=[_elderly_to_response(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{elderly_id}", response_model=ApiResponse)
def get_elderly(
    elderly_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """老人详情(含绑定的雷达设备信息)"""
    query = db.query(Elderly).filter(Elderly.id == elderly_id)

    # 权限过滤
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(Elderly.id.in_(elderly_ids))

    elderly = query.first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")
    return ApiResponse(data=_elderly_to_response(elderly))


@router.post("", response_model=ApiResponse)
def create_elderly(
    req: ElderlyCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """新增老人"""
    elderly = Elderly(**req.model_dump())
    db.add(elderly)
    db.commit()
    db.refresh(elderly)
    return ApiResponse(message="新增成功", data=_elderly_to_response(elderly))


@router.put("/{elderly_id}", response_model=ApiResponse)
def update_elderly(
    elderly_id: int,
    req: ElderlyUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新老人信息"""
    elderly = db.query(Elderly).filter(Elderly.id == elderly_id).first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(elderly, key, value)

    db.commit()
    db.refresh(elderly)
    return ApiResponse(message="更新成功", data=_elderly_to_response(elderly))


@router.delete("/{elderly_id}", response_model=ApiResponse)
def delete_elderly(
    elderly_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除老人"""
    elderly = db.query(Elderly).filter(Elderly.id == elderly_id).first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")
    db.delete(elderly)
    db.commit()
    return ApiResponse(message="删除成功")


@router.post("/{elderly_id}/bind-radar", response_model=ApiResponse)
def bind_radar(
    elderly_id: int,
    req: BindRadarRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """绑定雷达设备"""
    elderly = db.query(Elderly).filter(Elderly.id == elderly_id).first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")

    radar = db.query(RadarDevice).filter(RadarDevice.id == req.radar_device_id).first()
    if not radar:
        raise HTTPException(status_code=404, detail="雷达设备不存在")

    elderly.radar_device_id = req.radar_device_id
    db.commit()
    return ApiResponse(message="绑定成功")


@router.get("/{elderly_id}/radar-data", response_model=ApiResponse)
def get_elderly_radar_data(
    elderly_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取老人最新雷达数据"""
    query = db.query(Elderly).filter(Elderly.id == elderly_id)

    # 权限过滤
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(Elderly.id.in_(elderly_ids))

    elderly = query.first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")

    radar_data = (
        db.query(RadarData)
        .filter(RadarData.elder_id == elderly_id)
        .order_by(RadarData.timestamp.desc())
        .first()
    )

    if not radar_data:
        return ApiResponse(data=None)

    return ApiResponse(data=RadarDataResponse.model_validate(radar_data))


@router.get("/{elderly_id}/daily-reports", response_model=ApiResponse)
def get_daily_reports(
    elderly_id: int,
    days: int = Query(7, ge=1, le=90, description="查询最近N天"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取老人健康日报列表（按天聚合 RadarData）。
    返回最近 N 天每天的健康摘要。
    """
    query = db.query(Elderly).filter(Elderly.id == elderly_id)
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(Elderly.id.in_(elderly_ids))

    elderly = query.first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")

    start_date = datetime.now().date() - timedelta(days=days - 1)

    # 按天聚合雷达数据
    records = (
        db.query(
            func.date(RadarData.timestamp).label("report_date"),
            func.avg(RadarData.heart_rate).label("hr_avg"),
            func.min(RadarData.heart_rate).label("hr_min"),
            func.max(RadarData.heart_rate).label("hr_max"),
            func.avg(RadarData.breath_rate).label("br_avg"),
            func.min(RadarData.breath_rate).label("br_min"),
            func.max(RadarData.breath_rate).label("br_max"),
            func.sum(case((RadarData.fall_status == 1, 1), else_=0)).label("fall_count"),
            func.count(RadarData.id).label("data_count"),
        )
        .filter(
            RadarData.elder_id == elderly_id,
            func.date(RadarData.timestamp) >= start_date,
        )
        .group_by(func.date(RadarData.timestamp))
        .order_by(func.date(RadarData.timestamp).desc())
        .all()
    )

    # 收集所有日期范围用于批量查询告警
    report_dates = [r.report_date for r in records]

    # 批量获取每天告警数
    alert_counts = {}
    if report_dates:
        alert_rows = (
            db.query(
                func.date(AlertRecord.created_at).label("alert_date"),
                func.count(AlertRecord.id).label("cnt"),
            )
            .filter(
                AlertRecord.elder_id == elderly_id,
                func.date(AlertRecord.created_at) >= start_date,
            )
            .group_by(func.date(AlertRecord.created_at))
            .all()
        )
        alert_counts = {str(row.alert_date): row.cnt for row in alert_rows}

    # 构建日报列表
    daily_list = []
    for r in records:
        date_str = str(r.report_date)
        hr_avg = round(float(r.hr_avg), 0) if r.hr_avg is not None else None
        br_avg = round(float(r.br_avg), 0) if r.br_avg is not None else None

        # 异常判定
        hr_status = "normal"
        if hr_avg is not None:
            if hr_avg < 40 or hr_avg > 120:
                hr_status = "danger"
            elif hr_avg < 60 or hr_avg > 90:
                hr_status = "warning"

        br_status = "normal"
        if br_avg is not None:
            if br_avg < 8 or br_avg > 30:
                br_status = "danger"
            elif br_avg < 12 or br_avg > 24:
                br_status = "warning"

        fall_count = int(r.fall_count)

        daily_list.append({
            "date": date_str,
            "heartRateAvg": hr_avg,
            "heartRateMin": int(r.hr_min) if r.hr_min is not None else None,
            "heartRateMax": int(r.hr_max) if r.hr_max is not None else None,
            "heartRateStatus": hr_status,
            "breathRateAvg": br_avg,
            "breathRateMin": int(r.br_min) if r.br_min is not None else None,
            "breathRateMax": int(r.br_max) if r.br_max is not None else None,
            "breathRateStatus": br_status,
            "fallCount": fall_count,
            "alertCount": alert_counts.get(date_str, 0),
            "dataCount": int(r.data_count),
        })

    return ApiResponse(data={
        "elderlyId": elderly_id,
        "elderlyName": elderly.name,
        "days": days,
        "reports": daily_list,
    })
