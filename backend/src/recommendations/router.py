"""Recommendations Router"""
from fastapi import APIRouter, Query
from src.mock.generator import generate_recommendations

router = APIRouter()

@router.get("")
async def get_recommendations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    direction: str = None,
    risk_level: str = None,
    min_score: int = Query(0, ge=0, le=100),
):
    recs = generate_recommendations(30)
    if direction:
        recs = [r for r in recs if r["direction"] == direction]
    if risk_level:
        recs = [r for r in recs if r["riskLevel"] == risk_level]
    recs = [r for r in recs if r["overallScore"] >= min_score]
    total = len(recs)
    start = (page - 1) * page_size
    page_data = recs[start:start + page_size]
    return {
        "success": True, "data": page_data,
        "total": total, "page": page, "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size,
    }

@router.get("/{rec_id}")
async def get_recommendation(rec_id: str):
    recs = generate_recommendations(1)
    recs[0]["id"] = rec_id
    return {"success": True, "data": recs[0]}
