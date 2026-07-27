"""Search Router"""
from fastapi import APIRouter
from src.core.angel_one import angel_client

router = APIRouter()

@router.get("")
async def search_symbols(q: str):
    """Search for symbols."""
    results = angel_client.search_symbol(q)
    return {"success": True, "data": results}
