"""Settings Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

_settings = {
    "scoreWeights": {"priceAction": 0.20, "technical": 0.25, "optionChain": 0.30, "volume": 0.15, "quantitative": 0.10},
    "confidenceThreshold": 60, "riskThreshold": 70, "scannerFrequency": 15, "alertRules": {},
}

class UpdateSettings(BaseModel):
    scoreWeights: Optional[dict] = None
    confidenceThreshold: Optional[float] = None
    riskThreshold: Optional[float] = None
    scannerFrequency: Optional[int] = None

@router.get("")
async def get_settings():
    return {"success": True, "data": _settings}

@router.put("")
async def update_settings(body: UpdateSettings):
    if body.scoreWeights:
        _settings["scoreWeights"] = body.scoreWeights
    if body.confidenceThreshold is not None:
        _settings["confidenceThreshold"] = body.confidenceThreshold
    if body.riskThreshold is not None:
        _settings["riskThreshold"] = body.riskThreshold
    if body.scannerFrequency is not None:
        _settings["scannerFrequency"] = body.scannerFrequency
    return {"success": True, "data": _settings}
