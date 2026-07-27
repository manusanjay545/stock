"""Watchlist Router"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from src.core.auth import get_optional_user

router = APIRouter()

class WatchlistItem(BaseModel):
    symbol: str

@router.get("")
async def get_watchlists(user: dict | None = Depends(get_optional_user)):
    """Get all watchlists for a user."""
    # Placeholder
    return {"success": True, "data": [{"id": 1, "name": "Default Watchlist", "symbols": ["RELIANCE", "TCS"]}]}

@router.post("/{watchlist_id}/add")
async def add_to_watchlist(watchlist_id: int, item: WatchlistItem, user: dict | None = Depends(get_optional_user)):
    """Add a symbol to a watchlist."""
    return {"success": True, "message": f"Added {item.symbol} to watchlist"}
