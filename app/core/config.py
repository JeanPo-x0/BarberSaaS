from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "BarberSaaS"
    DATABASE_URL: str = "postgresql://postgres:kali@localhost/barbersaas"
    SECRET_KEY: str = "cambia-esta-clave-secreta-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()
