"""Alerts Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import random
from datetime import datetime

router = APIRouter()

_alerts = []

class CreateAlert(BaseModel):
    symbol: str
    alertType: str
    condition: str
    threshold: float

@router.get("")
async def get_alerts():
    return {"success": True, "data": _alerts}

@router.post("")
async def create_alert(body: CreateAlert):
    alert = {
        "id": f"a{random.randint(1000,9999)}", "userId": "user-1",
        "symbol": body.symbol, "alertType": body.alertType,
        "condition": body.condition, "threshold": body.threshold,
        "currentValue": 0, "isActive": True, "isTriggered": False,
        "createdAt": datetime.now().isoformat(),
    }
    _alerts.append(alert)
    return {"success": True, "data": alert}

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    global _alerts
    _alerts = [a for a in _alerts if a["id"] != alert_id]
    return {"success": True, "data": None}

@router.put("/{alert_id}/toggle")
async def toggle_alert(alert_id: str):
    for a in _alerts:
        if a["id"] == alert_id:
            a["isActive"] = not a["isActive"]
            return {"success": True, "data": a}
    return {"success": False, "message": "Not found"}
