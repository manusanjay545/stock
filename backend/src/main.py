"""
QuantStrike AI — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.market.router import router as market_router
from src.option_chain.router import router as option_chain_router
from src.recommendations.router import router as recommendations_router
from src.scanner.router import router as scanner_router
from src.watchlist.router import router as watchlist_router
from src.alerts.router import router as alerts_router
from src.backtest.router import router as backtest_router
from src.settings.router import router as settings_router
from src.auth.router import router as auth_router
from src.profile.router import router as profile_router
from src.fundamentals.router import router as fundamentals_router
from src.screener.router import router as screener_router
from src.subscription.router import router as subscription_router

app = FastAPI(
    title="QuantStrike AI API",
    description="AI-powered option chain analysis and strike price recommendations. "
                "All recommendations are probabilistic and for educational purposes only.",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"name": "QuantStrike AI API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Register routers
PREFIX = "/api/v1"
app.include_router(auth_router, prefix=f"{PREFIX}/auth", tags=["Auth"])
app.include_router(profile_router, prefix=f"{PREFIX}/profile", tags=["Profile"])
app.include_router(market_router, prefix=f"{PREFIX}/market", tags=["Market"])
app.include_router(option_chain_router, prefix=f"{PREFIX}/option-chain", tags=["Option Chain"])
app.include_router(recommendations_router, prefix=f"{PREFIX}/recommendations", tags=["Recommendations"])
app.include_router(scanner_router, prefix=f"{PREFIX}/scanner", tags=["Scanner"])
app.include_router(watchlist_router, prefix=f"{PREFIX}/watchlist", tags=["Watchlist"])
app.include_router(alerts_router, prefix=f"{PREFIX}/alerts", tags=["Alerts"])
app.include_router(backtest_router, prefix=f"{PREFIX}/backtest", tags=["Backtest"])
app.include_router(settings_router, prefix=f"{PREFIX}/settings", tags=["Settings"])
app.include_router(fundamentals_router, prefix=f"{PREFIX}/fundamentals", tags=["Fundamentals"])
app.include_router(screener_router, prefix=f"{PREFIX}/screener", tags=["Screener"])
app.include_router(subscription_router, prefix=f"{PREFIX}/subscription", tags=["Subscription"])
