"""QuantStrike API — FastAPI Application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.core.config import settings

# Import routers
from src.routers.market import router as market_router
from src.routers.company import router as company_router
from src.routers.screener import router as screener_router
from src.routers.charts import router as charts_router
from src.routers.search import router as search_router
from src.routers.watchlist import router as watchlist_router
from src.routers.portfolio import router as portfolio_router
from src.routers.alerts import router as alerts_router
from src.routers.profile import router as profile_router
from src.routers.subscription import router as subscription_router
from src.routers.health import router as health_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router, prefix="/api/v1/health", tags=["Health"])
app.include_router(market_router, prefix="/api/v1/market", tags=["Market Data"])
app.include_router(company_router, prefix="/api/v1/company", tags=["Company"])
app.include_router(screener_router, prefix="/api/v1/screener", tags=["Screener"])
app.include_router(charts_router, prefix="/api/v1/charts", tags=["Charts"])
app.include_router(search_router, prefix="/api/v1/search", tags=["Search"])
app.include_router(watchlist_router, prefix="/api/v1/watchlist", tags=["Watchlist"])
app.include_router(portfolio_router, prefix="/api/v1/portfolio", tags=["Portfolio"])
app.include_router(alerts_router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(subscription_router, prefix="/api/v1/subscription", tags=["Subscription"])


@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}
