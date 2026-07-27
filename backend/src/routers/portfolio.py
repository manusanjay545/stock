"""Portfolio Router"""
from fastapi import APIRouter, Depends
from src.core.auth import get_optional_user

router = APIRouter()

@router.get("")
async def get_portfolio(user: dict | None = Depends(get_optional_user)):
    """Get user portfolio."""
    return {"success": True, "data": {"holdings": [], "totalValue": 0}}
