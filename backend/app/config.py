import os
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "PayPilot AI Enterprise SaaS"
    APP_VERSION: str = "2.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")  # development, testing, staging, production
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./paypilot.db")
    DB_ECHO: bool = False

    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "paypilot-enterprise-sec-token-fy26-ind-saas")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "paypilot-enterprise-sec-token-fy26-ind-saas")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "120"))

    # AI Provider
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Multi-tenancy defaults
    DEFAULT_COMPANY_ID: str = "comp_ind_001"
    DEFAULT_COMPANY_NAME: str = "BharatTech Innovations Pvt. Ltd."

    # Payment Gateway (Razorpay India)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_ix2MK7zqiggJX7")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "k83caBjtnyKmD5fen5V4TYDx")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "whsec_paypilot_hmac_2026")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://akshaykrishna012.github.io"
    ]

    def validate_production_secrets(self):
        """Enforces that production deployments never run with default demo secrets."""
        if self.APP_ENV == "production":
            insecure_defaults = [
                "paypilot-enterprise-sec-token-fy26-ind-saas",
                "sec_paypilot_live_demo_test",
                "whsec_paypilot_hmac_2026"
            ]
            if self.SECRET_KEY in insecure_defaults:
                raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY must be provided via environment variable in production.")
            if self.JWT_SECRET in insecure_defaults:
                raise ValueError("CRITICAL SECURITY ERROR: JWT_SECRET must be provided via environment variable in production.")
            if self.RAZORPAY_KEY_SECRET in insecure_defaults:
                raise ValueError("CRITICAL SECURITY ERROR: RAZORPAY_KEY_SECRET must be configured securely in production.")

settings = Settings()
settings.validate_production_secrets()
