from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Barbero(Base):
    __tablename__ = "barberos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String)
    especialidad = Column(String)
    activo = Column(Boolean, default=True)
    barberia_id = Column(Integer, ForeignKey("barberias.id"))

    barberia = relationship("Barberia", back_populates="barberos")
