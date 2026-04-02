from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
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
    logo = Column(String)
    twilio_numero = Column(String, nullable=True)
    plan = Column(String, default="basico")
    subdominio = Column(String, nullable=True, unique=True)
    dueno_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    barberos = relationship("Barbero", back_populates="barberia")
    servicios = relationship("Servicio", back_populates="barberia")
    suscripcion = relationship("Suscripcion", back_populates="barberia", uselist=False)
