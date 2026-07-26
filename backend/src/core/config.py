"""QuantStrike AI — Application Configuration"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "QuantStrike AI"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./quantstrike.db"
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ]
    
    # Scoring defaults
    WEIGHT_PRICE_ACTION: float = 0.20
    WEIGHT_TECHNICAL: float = 0.25
    WEIGHT_OPTION_CHAIN: float = 0.30
    WEIGHT_VOLUME: float = 0.15
    WEIGHT_QUANTITATIVE: float = 0.10
    
    # Thresholds
    CONFIDENCE_THRESHOLD: float = 60.0
    RISK_THRESHOLD: float = 70.0
    SCANNER_FREQUENCY: int = 15

    class Config:
        env_file = ".env"


settings = Settings()
