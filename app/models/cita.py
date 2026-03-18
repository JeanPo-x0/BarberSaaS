from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    fecha_hora = Column(DateTime, nullable=False)
    estado = Column(String, default="pendiente")
    barbero_id = Column(Integer, ForeignKey("barberos.id"))
    servicio_id = Column(Integer, ForeignKey("servicios.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))

    barbero = relationship("Barbero")
    servicio = relationship("Servicio")
    cliente = relationship("Cliente")