from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class ConversacionBot(Base):
    __tablename__ = "conversaciones_bot"

    id = Column(Integer, primary_key=True, index=True)
    telefono = Column(String, unique=True, nullable=False, index=True)
    paso = Column(String, default="inicio")
    barberia_id = Column(Integer, ForeignKey("barberias.id"), nullable=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=True)
    barbero_id = Column(Integer, ForeignKey("barberos.id"), nullable=True)
    fecha = Column(String, nullable=True)
    nombre_temp = Column(String, nullable=True)
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())
