"""Subscription Router — Manage customer plans (FREE / PRO)"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

# In-memory store for demo — production uses Supabase
_subscriptions = {
    "user-1": {
        "userId": "user-1",
        "plan": "FREE",
        "status": "active",
        "startedAt": "2025-01-01T00:00:00Z",
        "expiresAt": None,
        "paymentMethod": None,
    }
}

class SubscribeRequest(BaseModel):
    plan: str  # "FREE" or "PRO"
    billing: str = "monthly"  # "monthly" or "yearly"
    payment_id: Optional[str] = None  # Razorpay payment ID

class SubscriptionResponse(BaseModel):
    userId: str
    plan: str
    status: str
    startedAt: str
    expiresAt: Optional[str]


@router.get("")
async def get_subscription():
    """Get current user's subscription details."""
    sub = _subscriptions.get("user-1")
    if not sub:
        return {"success": True, "data": {
            "plan": "FREE", "status": "active",
            "startedAt": datetime.utcnow().isoformat() + "Z",
            "expiresAt": None,
        }}
    return {"success": True, "data": sub}


@router.post("/upgrade")
async def upgrade_plan(body: SubscribeRequest):
    """
    Upgrade customer to PRO plan.
    In production: verify Razorpay payment_id before upgrading.
    """
    if body.plan not in ("FREE", "PRO"):
        raise HTTPException(status_code=400, detail="Invalid plan. Must be FREE or PRO.")

    # In production: verify payment with Razorpay API
    # import razorpay
    # client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    # client.payment.fetch(body.payment_id)

    now = datetime.utcnow().isoformat() + "Z"
    _subscriptions["user-1"] = {
        "userId": "user-1",
        "plan": body.plan,
        "status": "active",
        "startedAt": now,
        "expiresAt": None,
        "paymentMethod": body.payment_id,
    }

    return {
        "success": True,
        "data": _subscriptions["user-1"],
        "message": f"Successfully upgraded to {body.plan} plan.",
    }


@router.post("/cancel")
async def cancel_subscription():
    """Cancel PRO subscription — downgrade to FREE at end of billing cycle."""
    sub = _subscriptions.get("user-1")
    if sub and sub["plan"] == "PRO":
        sub["status"] = "canceled"
        return {"success": True, "data": sub, "message": "Subscription will end at billing cycle."}
    return {"success": True, "data": sub, "message": "No active PRO subscription."}
