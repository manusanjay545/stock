"""Profile Router"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..core.auth import get_current_user
from ..core.supabase import supabase

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    defaultMarket: Optional[str] = None
    notifications: Optional[bool] = None

@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)):
    """Get current user's profile from Supabase."""
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        profile = response.data
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        return {
            "success": True, 
            "data": {
                "id": user_id,
                "name": profile.get("full_name") or profile.get("display_name") or "User",
                "email": profile.get("email"),
                "defaultMarket": profile.get("default_market", "NIFTY"),
                "notifications": profile.get("notifications_enabled", True),
                "plan": profile.get("plan", "FREE"),
                "planStatus": profile.get("plan_status", "active"),
                "createdAt": profile.get("created_at"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
async def update_profile(body: ProfileUpdate, user_id: str = Depends(get_current_user)):
    """Update user preferences in Supabase."""
    try:
        update_data = {}
        if body.name is not None:
            update_data["full_name"] = body.name
            update_data["display_name"] = body.name
        if body.defaultMarket is not None:
            update_data["default_market"] = body.defaultMarket
        if body.notifications is not None:
            update_data["notifications_enabled"] = body.notifications
            
        if update_data:
            supabase.table("profiles").update(update_data).eq("id", user_id).execute()
            
        return {"success": True, "message": "Profile updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
