from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User, CaregiverElderly, Elderly
from app.schemas import (
    ApiResponse, PaginatedData,
    UserCreate, UserUpdate, UserResponse,
)
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/users", tags=["用户管理"])


@router.get("", response_model=ApiResponse)
def list_users(
    page: int = Query(1, ge=1, alias="page", description="页码"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="每页数量"),
    keyword: Optional[str] = Query(None, alias="keyword", description="搜索关键词"),
    role: Optional[str] = Query(None, alias="role", description="角色筛选"),
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """用户列表(分页+搜索，仅管理员)"""
    query = db.query(User)
    if keyword:
        query = query.filter(
            User.username.like(f"%{keyword}%")
            | User.display_name.like(f"%{keyword}%")
        )
    if role:
        query = query.filter(User.role == role)

    # 非 super_admin 只能看本机构用户
    if user.role != "super_admin":
        query = query.filter(User.institution_id == user.institution_id)

    total = query.count()
    items = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # 组装返回数据，包含 elderly_ids
    result_list = []
    for u in items:
        elderly_ids = [ce.elderly_id for ce in db.query(CaregiverElderly.elderly_id).filter(
            CaregiverElderly.caregiver_id == u.id
        ).all()]
        result_list.append({
            "id": u.id,
            "username": u.username,
            "displayName": u.display_name,
            "role": u.role,
            "phone": u.phone,
            "status": u.status,
            "institutionId": u.institution_id,
            "elderlyIds": elderly_ids,
            "createdAt": str(u.created_at) if u.created_at else None,
        })

    return ApiResponse(
        data=PaginatedData(
            list=result_list,
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.post("", response_model=ApiResponse)
def create_user(
    req: UserCreate,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """创建用户（仅管理员）"""
    # 检查用户名是否已存在
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")

    # 非 super_admin 创建的用户强制归属同一机构
    institution_id = user.institution_id

    new_user = User(
        username=req.username,
        password_hash=req.password,
        display_name=req.display_name,
        role=req.role,
        institution_id=institution_id,
        phone=req.phone or "",
        status=1,
    )
    db.add(new_user)
    db.flush()  # 获取 new_user.id

    # 创建护理员-老人分配关系
    for elderly_id in req.elderly_ids:
        # 验证老人存在
        elder = db.query(Elderly).filter(Elderly.id == elderly_id).first()
        if elder:
            ce = CaregiverElderly(
                caregiver_id=new_user.id,
                elderly_id=elderly_id,
            )
            db.add(ce)

    db.commit()
    db.refresh(new_user)

    return ApiResponse(message="创建成功", data={
        "id": new_user.id,
        "username": new_user.username,
        "displayName": new_user.display_name,
        "role": new_user.role,
    })


@router.put("/{user_id}", response_model=ApiResponse)
def update_user(
    user_id: int,
    req: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """更新用户（仅管理员）"""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    update_data = req.model_dump(exclude_unset=True)
    elderly_ids = update_data.pop("elderly_ids", None)

    for key, value in update_data.items():
        setattr(target_user, key, value)

    # 更新护理员-老人分配关系
    if elderly_ids is not None:
        # 删除旧关系
        db.query(CaregiverElderly).filter(
            CaregiverElderly.caregiver_id == user_id
        ).delete()
        # 创建新关系
        for eid in elderly_ids:
            elder = db.query(Elderly).filter(Elderly.id == eid).first()
            if elder:
                ce = CaregiverElderly(
                    caregiver_id=user_id,
                    elderly_id=eid,
                )
                db.add(ce)

    db.commit()
    db.refresh(target_user)
    return ApiResponse(message="更新成功")


@router.put("/{user_id}/status", response_model=ApiResponse)
def toggle_user_status(
    user_id: int,
    status: int = Query(..., description="1启用 0禁用"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """启用/禁用用户（仅管理员）"""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="不能禁用自己")

    target_user.status = status
    db.commit()
    return ApiResponse(message="操作成功")


@router.get("/{user_id}/elderly", response_model=ApiResponse)
def get_user_elderly(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """查看用户负责的老人列表（仅管理员）"""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")

    elderly_ids = [
        ce.elderly_id for ce in
        db.query(CaregiverElderly.elderly_id).filter(
            CaregiverElderly.caregiver_id == user_id
        ).all()
    ]
    elderly_list = db.query(Elderly).filter(Elderly.id.in_(elderly_ids)).all() if elderly_ids else []

    return ApiResponse(data=[
        {
            "id": e.id,
            "name": e.name,
            "roomNo": e.room_no,
        }
        for e in elderly_list
    ])
