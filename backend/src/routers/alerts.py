"""Alerts Router"""
from fastapi import APIRouter, Depends
from src.core.auth import get_optional_user

router = APIRouter()

@router.get("")
async def get_alerts(user: dict | None = Depends(get_optional_user)):
    """Get user alerts."""
    return {"success": True, "data": []}
