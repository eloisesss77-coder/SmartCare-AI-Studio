"""家属管理路由：绑定/解绑老人、查询家属列表"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Family, FamilyElderly, Elderly, User
from app.schemas import (
    ApiResponse,
    FamilyCreate,
    FamilyBindElderly,
    FamilyResponse,
    FamilyElderlyResponse,
)
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/family", tags=["家属管理"])


@router.post("/register", response_model=ApiResponse)
def register_or_login(
    req: FamilyCreate,
    db: Session = Depends(get_db),
):
    """
    家属注册/登录（通过小程序 wx.login 获取 openid 后调用）。
    如果已存在则更新信息，不存在则创建。
    无需认证（小程序端调用）。
    """
    family = db.query(Family).filter(Family.openid == req.openid).first()

    if family:
        # 更新信息
        family.nickname = req.nickname or family.nickname
        family.avatar_url = req.avatar_url or family.avatar_url
        family.phone = req.phone or family.phone
        family.unionid = req.unionid or family.unionid
        db.commit()
        db.refresh(family)
        logger.info(f"家属更新信息: openid={req.openid}")
    else:
        family = Family(
            openid=req.openid,
            unionid=req.unionid or "",
            nickname=req.nickname or "",
            avatar_url=req.avatar_url or "",
            phone=req.phone or "",
            status=1,
        )
        db.add(family)
        db.commit()
        db.refresh(family)
        logger.info(f"家属注册成功: openid={req.openid}")

    # 返回已绑定的老人列表
    bindings = (
        db.query(FamilyElderly, Elderly)
        .join(Elderly, FamilyElderly.elderly_id == Elderly.id)
        .filter(FamilyElderly.family_id == family.id)
        .all()
    )

    elderly_list = [
        {
            "elderlyId": b.FamilyElderly.elderly_id,
            "elderlyName": b.Elderly.name,
            "roomNo": b.Elderly.room_no,
            "relation": b.FamilyElderly.relation,
            "isPrimary": b.FamilyElderly.is_primary,
        }
        for b in bindings
    ]

    return ApiResponse(data={
        "familyId": family.id,
        "openid": family.openid,
        "nickname": family.nickname,
        "phone": family.phone,
        "elderlyList": elderly_list,
    })


@router.post("/bind", response_model=ApiResponse)
def bind_elderly(
    req: FamilyBindElderly,
    db: Session = Depends(get_db),
):
    """
    家属绑定老人。
    需要家属先在 register 接口获取 familyId，然后携带 familyId 调用。
    小程序端通过 header 传递 X-Family-Id。
    """
    # 这里需要从 header 获取 family_id，简化处理：从请求中传
    # 实际使用中由小程序在请求中携带 family_id
    # 此处保持简单，由前端传递
    pass  # 占位，等待与小程序前端联调时完善


@router.get("/elderly/{elderly_id}", response_model=ApiResponse)
def get_elderly_families(
    elderly_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """查询某个老人绑定的所有家属（Web 管理端使用）"""
    # 验证老人存在
    elderly = db.query(Elderly).filter(Elderly.id == elderly_id).first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")

    bindings = (
        db.query(FamilyElderly, Family)
        .join(Family, FamilyElderly.family_id == Family.id)
        .filter(FamilyElderly.elderly_id == elderly_id)
        .all()
    )

    result = [
        {
            "id": b.FamilyElderly.id,
            "familyId": b.Family.id,
            "nickname": b.Family.nickname,
            "phone": b.Family.phone,
            "relation": b.FamilyElderly.relation,
            "isPrimary": b.FamilyElderly.is_primary,
            "boundAt": str(b.FamilyElderly.created_at) if b.FamilyElderly.created_at else None,
        }
        for b in bindings
    ]

    return ApiResponse(data=result)


@router.delete("/unbind/{binding_id}", response_model=ApiResponse)
def unbind_elderly(
    binding_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """解除家属与老人的绑定关系（Web 管理端使用）"""
    binding = db.query(FamilyElderly).filter(FamilyElderly.id == binding_id).first()
    if not binding:
        raise HTTPException(status_code=404, detail="绑定关系不存在")

    db.delete(binding)
    db.commit()
    logger.info(f"解除家属绑定: id={binding_id}, family_id={binding.family_id}")
    return ApiResponse(message="解绑成功")
