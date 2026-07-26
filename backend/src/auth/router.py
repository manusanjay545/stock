"""Auth Router (placeholder for Supabase Auth integration)"""
from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
async def login():
    return {"success": True, "data": {"message": "Use Supabase Auth client-side"}}

@router.post("/signup")
async def signup():
    return {"success": True, "data": {"message": "Use Supabase Auth client-side"}}

@router.post("/logout")
async def logout():
    return {"success": True, "data": {"message": "Session cleared"}}
