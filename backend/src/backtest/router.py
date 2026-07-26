"""Backtest Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from src.mock.generator import generate_backtest_result

router = APIRouter()

class BacktestInput(BaseModel):
    symbol: str = "NIFTY"
    startDate: str = "2025-01-01"
    endDate: str = "2025-06-30"
    capital: float = 100000
    expiry: str = ""
    strategy: str = "momentum"
    riskLevel: str = "MEDIUM"

@router.post("/run")
async def run_backtest(body: BacktestInput):
    result = generate_backtest_result()
    return {"success": True, "data": result}

@router.get("/history")
async def backtest_history():
    return {"success": True, "data": []}
