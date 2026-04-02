from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base
from datetime import datetime

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False)
    creado_en = Column(DateTime, default=datetime.utcnow)
