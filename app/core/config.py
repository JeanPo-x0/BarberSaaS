from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "BarberSaaS"
    DATABASE_URL: str = "postgresql://postgres:kali@localhost/barbersaas"
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60      # 1 hora — se renueva via /auth/refresh
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    CORS_ORIGINS: str = "https://barber-saa-s-phi.vercel.app,http://localhost:3000"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_set(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError("SECRET_KEY debe tener al menos 32 caracteres y estar definida en variables de entorno")
        return v

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PRO_MENSUAL: str = ""
    STRIPE_PRICE_PRO_ANUAL: str = ""
    STRIPE_PRICE_PREMIUM_MENSUAL: str = ""
    STRIPE_PRICE_PREMIUM_ANUAL: str = ""
    STRIPE_COUPON_EARLYACCESS: str = "EARLYACCESS"

    # App
    DOCS_ENABLED: bool = False  # Activar solo en desarrollo local con DOCS_ENABLED=true en .env
    FRONTEND_URL: str = "http://localhost:3000"
    SAAS_DOMAIN: str = "barbersaas.com"
    SUPERADMIN_EMAIL: str = "saascompany.cr@gmail.com"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
