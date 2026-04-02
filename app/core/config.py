from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "BarberSaaS"
    DATABASE_URL: str = "postgresql://postgres:kali@localhost/barbersaas"
    SECRET_KEY: str = "cambia-esta-clave-secreta-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 días

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PRO_MENSUAL: str = ""
    STRIPE_PRICE_PRO_ANUAL: str = ""
    STRIPE_PRICE_PREMIUM_MENSUAL: str = ""
    STRIPE_PRICE_PREMIUM_ANUAL: str = ""
    STRIPE_COUPON_EARLYACCESS: str = "EARLYACCESS"

    # App
    FRONTEND_URL: str = "http://localhost:3000"
    SAAS_DOMAIN: str = "barbersaas.com"
    SUPERADMIN_EMAIL: str = "admin@barbersaas.com"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
