from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    duracion_minutos = Column(Integer, nullable=False)
    precio = Column(Float, nullable=False)
    barberia_id = Column(Integer, ForeignKey("barberias.id"))

    barberia = relationship("Barberia", back_populates="servicios")
