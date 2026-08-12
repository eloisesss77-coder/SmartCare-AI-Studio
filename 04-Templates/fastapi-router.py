"""
FastAPI Router 标准模板
基于安伴 Guardian 项目实际路由规范

使用方式：
  - 复制到 app/routers/{module}.py
  - 在 app/main.py 中注册: app.include_router({module}.router)
  - 在 app/schemas.py 中定义 Schema 模型
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, {ModelName}
from app.schemas import (
    ApiResponse,
    PaginatedData,
    {ModelName}Create,
    {ModelName}Update,
    {ModelName}Response,
)
from app.dependencies.auth import get_current_user, get_user_elderly_ids

logger = logging.getLogger(__name__)

# 定义路由：prefix 遵循 /api/v1/{module} 规范，tags 用于 Swagger 分组
router = APIRouter(prefix="/api/v1/{module}", tags=["{模块中文名}"])


@router.get("", response_model=ApiResponse)
def list_{module}(
    page: int = Query(1, ge=1, alias="page", description="页码"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="每页数量"),
    keyword: Optional[str] = Query(None, alias="keyword", description="搜索关键词"),
    status: Optional[int] = Query(None, alias="status", description="状态筛选"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """分页列表 — 支持关键词搜索和状态筛选

    权限：caregiver 只能看到分配范围内的数据
    """
    query = db.query({ModelName})

    # 搜索过滤
    if keyword:
        query = query.filter({ModelName}.name.like(f"%{keyword}%"))
    if status is not None:
        query = query.filter({ModelName}.status == status)

    # 权限过滤（非 admin 用户只可见授权数据）
    allowed_ids = get_user_elderly_ids(user, db)
    if allowed_ids:
        query = query.filter({ModelName}.id.in_(allowed_ids))

    total = query.count()
    items = (
        query.order_by({ModelName}.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ApiResponse(
        data=PaginatedData(
            list=[{ModelName}Response.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{id}", response_model=ApiResponse)
def get_{module}_detail(
    id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """详情查询 — 返回单条记录的完整信息"""
    query = db.query({ModelName}).filter({ModelName}.id == id)

    # 权限过滤
    allowed_ids = get_user_elderly_ids(user, db)
    if allowed_ids:
        query = query.filter({ModelName}.id.in_(allowed_ids))

    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail="{模块名}不存在")

    return ApiResponse(data={ModelName}Response.model_validate(item))


@router.post("", response_model=ApiResponse)
def create_{module}(
    req: {ModelName}Create,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """新增记录 — 字段校验在 Schema 层完成"""
    # 检查唯一性约束（按实际业务调整）
    existing = db.query({ModelName}).filter({ModelName}.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="名称已存在")

    item = {ModelName}(**req.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)

    return ApiResponse(message="创建成功", data={ModelName}Response.model_validate(item))


@router.put("/{id}", response_model=ApiResponse)
def update_{module}(
    id: int,
    req: {ModelName}Update,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新记录 — 仅更新传入的非空字段"""
    item = db.query({ModelName}).filter({ModelName}.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="{模块名}不存在")

    # 仅更新显式传入的字段
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return ApiResponse(message="更新成功", data={ModelName}Response.model_validate(item))


@router.delete("/{id}", response_model=ApiResponse)
def delete_{module}(
    id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除记录（硬删除，软删除用 PUT 更新 status 字段）"""
    item = db.query({ModelName}).filter({ModelName}.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="{模块名}不存在")

    db.delete(item)
    db.commit()

    return ApiResponse(message="删除成功")
