"""Profile Router"""
from fastapi import APIRouter, Depends
from src.core.auth import get_optional_user

router = APIRouter()

@router.get("")
async def get_profile(user: dict | None = Depends(get_optional_user)):
    """Get user profile."""
    if not user:
        return {"success": False, "message": "Not authenticated"}
    return {"success": True, "data": {"id": user["id"], "email": user["email"], "plan": "FREE"}}
