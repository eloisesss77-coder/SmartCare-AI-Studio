from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import ApiResponse, LoginRequest, ChangePasswordRequest
from app.dependencies.auth import create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["认证"])


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.status != 1:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if user.password_hash != req.password:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = create_access_token({"user_id": user.id})
    return ApiResponse(data={
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "displayName": user.display_name,
            "role": user.role,
            "institutionId": user.institution_id,
        }
    })


@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """获取当前用户信息"""
    return ApiResponse(data={
        "id": user.id,
        "username": user.username,
        "displayName": user.display_name,
        "role": user.role,
        "institutionId": user.institution_id,
        "phone": user.phone,
    })


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """修改密码"""
    if user.password_hash != req.old_password:
        raise HTTPException(status_code=400, detail="原密码错误")
    user.password_hash = req.new_password
    db.commit()
    return ApiResponse(message="密码修改成功")
