"""Subscription Router — Manage customer plans (FREE / PRO)"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..core.auth import get_current_user
from ..core.supabase import supabase

router = APIRouter()

class SubscribeRequest(BaseModel):
    plan: str  # "FREE" or "PRO"
    billing: str = "monthly"  # "monthly" or "yearly"
    payment_id: Optional[str] = None  # Razorpay payment ID

@router.get("")
async def get_subscription(user_id: str = Depends(get_current_user)):
    """Get current user's subscription details from Supabase."""
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        profile = response.data
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        return {
            "success": True, 
            "data": {
                "userId": user_id,
                "plan": profile.get("plan", "FREE"),
                "status": profile.get("plan_status", "active"),
                "startedAt": profile.get("created_at"),
                "expiresAt": None, # Handle expiry if needed
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upgrade")
async def upgrade_plan(body: SubscribeRequest, user_id: str = Depends(get_current_user)):
    """
    Upgrade customer to PRO plan.
    """
    if body.plan not in ("FREE", "PRO"):
        raise HTTPException(status_code=400, detail="Invalid plan. Must be FREE or PRO.")

    # In production: verify payment with Razorpay API here
    
    try:
        response = supabase.table("profiles").update({
            "plan": body.plan,
            "plan_status": "active",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
        
        updated_profile = response.data[0]
        
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "plan": updated_profile.get("plan"),
                "status": updated_profile.get("plan_status"),
                "startedAt": updated_profile.get("created_at"),
            },
            "message": f"Successfully upgraded to {body.plan} plan.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel")
async def cancel_subscription(user_id: str = Depends(get_current_user)):
    """Cancel PRO subscription."""
    try:
        response = supabase.table("profiles").select("plan").eq("id", user_id).single().execute()
        current_plan = response.data.get("plan")
        
        if current_plan == "PRO":
            supabase.table("profiles").update({
                "plan_status": "canceled",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
            
            return {"success": True, "message": "Subscription will end at billing cycle."}
            
        return {"success": True, "message": "No active PRO subscription."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
