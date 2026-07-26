"""Watchlist Router"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# In-memory store for demo
_watchlists = [
    {"id": "w1", "name": "Index Options", "userId": "user-1", "items": [
        {"id": "i1", "symbol": "NIFTY", "type": "INDEX", "addedAt": "2025-01-01"},
        {"id": "i2", "symbol": "BANKNIFTY", "type": "INDEX", "addedAt": "2025-01-01"},
    ], "createdAt": "2025-01-01"},
]

class CreateWatchlist(BaseModel):
    name: str

@router.get("")
async def get_watchlists():
    return {"success": True, "data": _watchlists}

@router.post("")
async def create_watchlist(body: CreateWatchlist):
    wl = {"id": f"w{len(_watchlists)+1}", "name": body.name, "userId": "user-1", "items": [], "createdAt": "2025-01-01"}
    _watchlists.append(wl)
    return {"success": True, "data": wl}

@router.delete("/{wl_id}")
async def delete_watchlist(wl_id: str):
    global _watchlists
    _watchlists = [w for w in _watchlists if w["id"] != wl_id]
    return {"success": True, "data": None}
