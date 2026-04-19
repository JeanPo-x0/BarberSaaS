from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ConfiguracionPagos(Base):
    __tablename__ = "configuracion_pagos"

    id                       = Column(Integer, primary_key=True, index=True)
    barberia_id              = Column(Integer, ForeignKey("barberias.id"), unique=True, nullable=False)
    sinpe_habilitado         = Column(Boolean, default=True)
    sinpe_numero             = Column(String, nullable=True)
    sinpe_nombre             = Column(String, nullable=True)
    efectivo_habilitado      = Column(Boolean, default=True)
    deposito_requerido       = Column(Boolean, default=False)
    deposito_porcentaje      = Column(Integer, default=50)
    cancelacion_porcentaje   = Column(Integer, default=0)
    cancelacion_horas_minimo = Column(Integer, default=24)

    barberia = relationship("Barberia")
