from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class BloqueoDisponibilidad(Base):
    __tablename__ = "bloqueos_disponibilidad"

    id = Column(Integer, primary_key=True, index=True)
    barbero_id = Column(Integer, ForeignKey("barberos.id"), nullable=False, index=True)
    fecha = Column(Date, nullable=False)
    motivo = Column(String, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

    barbero = relationship("Barbero")
