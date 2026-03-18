from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Barberia(Base):
    __tablename__ = "barberias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    direccion = Column(String)
    telefono = Column(String)
    email = Column(String, unique=True)
    activa = Column(Boolean, default=True)

    barberos = relationship("Barbero", back_populates="barberia")
    servicios = relationship("Servicio", back_populates="barberia")
