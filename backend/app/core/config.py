from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./constructpro_local.db"

    # JWT — IMPORTANT: override SECRET_KEY with a strong random key in production
    # Generate one with: python3 -c "import secrets; print(secrets.token_hex(64))"
    SECRET_KEY: str = "dev-secret-key-change-in-production-MUST-BE-CHANGED"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60        # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30           # 30 days

    # CORS / Frontend
    FRONTEND_URL: str = ""  # e.g. https://app.constructpro.in (set in production .env)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    # Rate limiting (requests per minute per IP for auth endpoints)
    RATE_LIMIT_AUTH_PER_MINUTE: int = 20

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
