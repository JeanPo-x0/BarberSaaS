from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    rol = Column(String, nullable=False)  # "dueno" o "barbero"
    barberia_id = Column(Integer, ForeignKey("barberias.id"))
    email_verificado = Column(Boolean, default=False, server_default='false', nullable=False)

    barberia = relationship("Barberia", foreign_keys=[barberia_id])
