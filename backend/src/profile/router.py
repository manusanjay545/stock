"""Profile Router"""
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def get_profile():
    return {"success": True, "data": {
        "id": "user-1", 
        "email": "trader@quantstrike.ai", 
        "name": "Trader",
        "role": "USER",
        "plan": "PRO", # FREE or PRO
        "planStatus": "active",
        "preferences": {"defaultMarket": "NIFTY", "theme": "dark", "notifications": True},
        "createdAt": "2025-01-01",
    }}

@router.put("")
async def update_profile():
    return {"success": True, "data": {"message": "Profile updated"}}
