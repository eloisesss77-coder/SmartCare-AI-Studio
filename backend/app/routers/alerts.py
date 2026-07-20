import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import AlertRecord, AlertRule, User
from app.schemas import (
    AlertRuleCreate, AlertRuleUpdate, AlertRuleResponse,
    AlertRecordResponse, HandleAlertRequest, AlertCreate,
    ApiResponse, PaginatedData,
)
from app.dependencies.auth import get_current_user, get_user_elderly_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/alerts", tags=["告警管理"])


@router.post("", response_model=ApiResponse)
def create_alert(req: AlertCreate, db: Session = Depends(get_db)):
    """接收来自 Zabbix Webhook 的告警创建（无认证，机器间通信）"""
    # 告警级别映射
    level_map = {"not_classified": "info", "information": "info", "info": "info",
                 "warning": "warning", "average": "warning",
                 "high": "critical", "critical": "critical",
                 "disaster": "emergency", "emergency": "emergency"}
    alert_level = level_map.get(str(req.alert_level), "warning")

    alert = AlertRecord(
        elder_id=int(req.elder_id) if req.elder_id and req.elder_id.isdigit() else None,
        alert_type=req.alert_type,
        alert_level=alert_level,
        alert_message=req.alert_message,
        trigger_value=req.trigger_value or "",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    logger.info(f"Zabbix Webhook 创建告警: id={alert.id}, type={req.alert_type}, level={alert_level}")
    return ApiResponse(message="告警创建成功", data={"id": alert.id})


@router.get("", response_model=ApiResponse)
def list_alerts(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    level: Optional[str] = Query(None, alias="level", description="告警级别: info/warning/critical/emergency"),
    status: Optional[int] = Query(None, alias="status", description="处理状态"),
    alert_level: Optional[str] = Query(None, description="告警级别(兼容)"),
    handled_status: Optional[int] = Query(None, description="处理状态(兼容)"),
    start: Optional[str] = Query(None, description="开始时间"),
    end: Optional[str] = Query(None, description="结束时间"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """告警列表(分页+筛选)"""
    # 兼容前端传 level/status 和原 alert_level/handled_status 两种参数名
    _level = level or alert_level
    _status = status if status is not None else handled_status

    query = db.query(AlertRecord)
    if _level:
        query = query.filter(AlertRecord.alert_level == _level)
    if _status is not None:
        query = query.filter(AlertRecord.handled_status == _status)
    if start:
        query = query.filter(AlertRecord.created_at >= start)
    if end:
        query = query.filter(AlertRecord.created_at <= end)

    # 权限过滤：caregiver 只能看到分配老人的告警
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(AlertRecord.elder_id.in_(elderly_ids))

    total = query.count()
    items = (
        query.order_by(AlertRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApiResponse(
        data=PaginatedData(
            list=[AlertRecordResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{alert_id}", response_model=ApiResponse)
def get_alert_detail(
    alert_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """告警详情"""
    query = db.query(AlertRecord).filter(AlertRecord.id == alert_id)

    # 权限过滤
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(AlertRecord.elder_id.in_(elderly_ids))

    alert = query.first()
    if not alert:
        raise HTTPException(status_code=404, detail="告警记录不存在")
    return ApiResponse(data=AlertRecordResponse.model_validate(alert))


@router.put("/{alert_id}/handle", response_model=ApiResponse)
def handle_alert(
    alert_id: int,
    req: HandleAlertRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """处理告警"""
    query = db.query(AlertRecord).filter(AlertRecord.id == alert_id)

    # 权限过滤
    elderly_ids = get_user_elderly_ids(user, db)
    if elderly_ids:
        query = query.filter(AlertRecord.elder_id.in_(elderly_ids))

    alert = query.first()
    if not alert:
        raise HTTPException(status_code=404, detail="告警记录不存在")

    alert.handled_status = req.handled_status
    alert.handled_by = req.handled_by
    alert.handled_at = datetime.now()
    alert.handle_remark = req.handle_remark or ""

    db.commit()
    db.refresh(alert)

    logger.info(f"告警 {alert_id} 已由 {req.handled_by} 处理, 状态: {req.handled_status}")
    return ApiResponse(message="处理成功", data=AlertRecordResponse.model_validate(alert))


# ------------------------------------------------------------
# 告警规则
# ------------------------------------------------------------

@router.get("/rules", response_model=ApiResponse)
def list_alert_rules(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    rule_type: Optional[str] = Query(None, description="规则类型"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """告警规则列表"""
    query = db.query(AlertRule)
    if rule_type:
        query = query.filter(AlertRule.rule_type == rule_type)

    total = query.count()
    items = (
        query.order_by(AlertRule.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApiResponse(
        data=PaginatedData(
            list=[AlertRuleResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.post("/rules", response_model=ApiResponse)
def create_alert_rule(
    req: AlertRuleCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """新增告警规则"""
    rule = AlertRule(**req.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    logger.info(f"新增告警规则: {rule.rule_name}")
    return ApiResponse(message="创建成功", data=AlertRuleResponse.model_validate(rule))


@router.put("/rules/{rule_id}", response_model=ApiResponse)
def update_alert_rule(
    rule_id: int,
    req: AlertRuleUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新告警规则"""
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="告警规则不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    logger.info(f"更新告警规则: {rule.rule_name}")
    return ApiResponse(message="更新成功", data=AlertRuleResponse.model_validate(rule))


@router.delete("/rules/{rule_id}", response_model=ApiResponse)
def delete_alert_rule(
    rule_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除告警规则（仅管理员）"""
    if user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="仅管理员可删除告警规则")

    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="告警规则不存在")

    db.delete(rule)
    db.commit()
    logger.info(f"删除告警规则: {rule.rule_name}")
    return ApiResponse(message="删除成功")
