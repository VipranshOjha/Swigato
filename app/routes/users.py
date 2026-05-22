from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserUpdate, RoleUpdate

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.put("/me")
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.email is not None:
        current_user.email = payload.email

    if payload.phone is not None:
        current_user.phone = payload.phone

    db.commit()
    db.refresh(current_user)

    return current_user

@router.patch("/me/role")
def update_role(
    payload: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_roles = [
        "customer",
        "restaurant_owner",
        "delivery_partner"
    ]

    if payload.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    current_user.role = payload.role

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Role updated successfully",
        "role": current_user.role
    }