"""家属管理路由：注册/登录、绑定码机制、绑定/解绑老人"""
import logging
import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Family, FamilyElderly, Elderly, User, BindCode
from app.schemas import (
    ApiResponse,
    FamilyCreate,
    FamilyResponse,
    FamilyElderlyResponse,
    GenerateBindCodeRequest,
    UseBindCodeRequest,
)
from app.dependencies.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/family", tags=["家属管理"])


def _generate_bind_code_str(length: int = 6) -> str:
    """生成随机绑定码"""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


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


# ---------------------------------------------------------------
# 绑定码机制（管理端生成 → 小程序扫码绑定）
# ---------------------------------------------------------------

@router.post("/generate-bind-code", response_model=ApiResponse)
def generate_bind_code(
    req: GenerateBindCodeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    管理端为老人生成家属绑定码。
    绑定码有效期24小时，小程序端输入绑定码即可完成绑定。
    """
    # 验证老人存在
    elderly = db.query(Elderly).filter(Elderly.id == req.elderly_id).first()
    if not elderly:
        raise HTTPException(status_code=404, detail="老人不存在")

    # 生成唯一绑定码
    for _ in range(10):
        code = _generate_bind_code_str()
        existing = db.query(BindCode).filter(BindCode.bind_code == code).first()
        if not existing:
            break
    else:
        raise HTTPException(status_code=500, detail="生成绑定码失败，请重试")

    bind_code = BindCode(
        bind_code=code,
        elderly_id=req.elderly_id,
        relation=req.relation,
        generated_by=user.id,
        is_used=0,
        expire_at=datetime.now() + timedelta(hours=24),
    )
    db.add(bind_code)
    db.commit()
    db.refresh(bind_code)

    logger.info(f"生成绑定码: code={code}, elderly={elderly.name}, user={user.display_name}")

    return ApiResponse(data={
        "id": bind_code.id,
        "bindCode": code,
        "elderlyId": req.elderly_id,
        "elderlyName": elderly.name,
        "roomNo": elderly.room_no,
        "relation": req.relation,
        "expireAt": str(bind_code.expire_at),
    })


@router.post("/use-bind-code", response_model=ApiResponse)
def use_bind_code(
    req: UseBindCodeRequest,
    x_family_id: int = Header(..., alias="X-Family-Id", description="家属账号ID"),
    db: Session = Depends(get_db),
):
    """
    小程序端使用绑定码绑定老人
    Header: X-Family-Id: 家属账号ID
    """
    # 验证绑定码
    bind_code = db.query(BindCode).filter(
        BindCode.bind_code == req.bind_code,
        BindCode.is_used == 0,
    ).first()

    if not bind_code:
        raise HTTPException(status_code=400, detail="绑定码无效或已使用")
    if bind_code.expire_at and bind_code.expire_at < datetime.now():
        raise HTTPException(status_code=400, detail="绑定码已过期，请重新获取")

    # 验证家属账号
    family = db.query(Family).filter(Family.id == x_family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="家属账号不存在")

    # 检查是否已绑定
    existing = db.query(FamilyElderly).filter(
        FamilyElderly.family_id == x_family_id,
        FamilyElderly.elderly_id == bind_code.elderly_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="您已绑定过该老人")

    # 创建绑定关系
    relation = req.relation or bind_code.relation or "子女"
    binding = FamilyElderly(
        family_id=x_family_id,
        elderly_id=bind_code.elderly_id,
        relation=relation,
        is_primary=0,
    )
    db.add(binding)

    # 标记绑定码已使用
    bind_code.is_used = 1
    bind_code.used_by_family_id = x_family_id

    db.commit()
    db.refresh(binding)

    elderly = db.query(Elderly).filter(Elderly.id == bind_code.elderly_id).first()
    logger.info(f"家属绑定成功: family={family.nickname}, elderly={elderly.name if elderly else '未知'}")

    return ApiResponse(data={
        "elderlyId": bind_code.elderly_id,
        "elderlyName": elderly.name if elderly else "",
        "roomNo": elderly.room_no if elderly else "",
        "relation": relation,
    })


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
