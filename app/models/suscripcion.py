from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Suscripcion(Base):
    __tablename__ = "suscripciones"

    id = Column(Integer, primary_key=True, index=True)
    barberia_id = Column(Integer, ForeignKey("barberias.id"), unique=True, nullable=False)
    plan = Column(String, default="basico")          # basico | pro | premium
    estado = Column(String, default="trial")          # trial | activa | suspendida | cancelada
    periodo = Column(String, default="mensual")       # mensual | anual
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_trial_fin = Column(DateTime, nullable=True)
    fecha_renovacion = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)

    barberia = relationship("Barberia", back_populates="suscripcion")
