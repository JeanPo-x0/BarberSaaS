from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ListaEspera(Base):
    __tablename__ = "lista_espera"

    id = Column(Integer, primary_key=True, index=True)
    barberia_id = Column(Integer, ForeignKey("barberias.id"), nullable=False)
    barbero_id = Column(Integer, ForeignKey("barberos.id"), nullable=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=True)
    cliente_nombre = Column(String, nullable=False)
    cliente_telefono = Column(String, nullable=False)
    fecha_preferida = Column(DateTime, nullable=True)
    posicion = Column(Integer, nullable=False)
    estado = Column(String, default="esperando")  # esperando | notificado | confirmado | expirado
    notificado_en = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)

    barberia = relationship("Barberia")
    barbero = relationship("Barbero")
    servicio = relationship("Servicio")
