from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Cita(Base):
    __tablename__ = "citas"

    id = Column(Integer, primary_key=True, index=True)
    fecha_hora = Column(DateTime, nullable=False)
    estado = Column(String, default="pendiente")
    estado_pago = Column(String, default="exento")   # exento|pendiente|confirmado|rechazado
    metodo_pago = Column(String, nullable=True)       # sinpe|efectivo|null
    comprobante_url = Column(String, nullable=True)   # URL pública del comprobante SINPE
    servicios_extra = Column(JSON, nullable=True)      # [{id, nombre, precio, duracion_minutos}]
    barbero_id = Column(Integer, ForeignKey("barberos.id"))
    servicio_id = Column(Integer, ForeignKey("servicios.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))

    barbero = relationship("Barbero")
    servicio = relationship("Servicio")
    cliente = relationship("Cliente")