"""Subscription Router"""
from fastapi import APIRouter, Depends
from src.core.auth import get_optional_user

router = APIRouter()

@router.get("")
async def get_subscription(user: dict | None = Depends(get_optional_user)):
    """Get user subscription status."""
    return {"success": True, "data": {"plan": "FREE", "active": True}}
