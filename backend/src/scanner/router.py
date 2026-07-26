"""Scanner Router"""
from fastapi import APIRouter
from src.mock.generator import generate_scanner_results

router = APIRouter()

@router.get("")
async def get_scanner_results(category: str = None):
    results = generate_scanner_results(18)
    if category:
        results = [r for r in results if r["category"] == category]
    return {"success": True, "data": results}
