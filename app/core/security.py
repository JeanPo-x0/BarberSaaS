from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def crear_token(data: dict, expire_minutes: int | None = None) -> str:
    payload = data.copy()
    minutes = expire_minutes if expire_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    expira = datetime.utcnow() + timedelta(minutes=minutes)
    payload.update({
        "exp": expira,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4()),
    })
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def crear_refresh_token(data: dict) -> str:
    return crear_token(data, expire_minutes=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60)

def verificar_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Validar que exp no sea más de 31 días en el futuro (protección extra)
        exp = payload.get("exp")
        if exp and datetime.utcfromtimestamp(exp) > datetime.utcnow() + timedelta(days=31):
            return None
        return payload
    except JWTError:
        return None
