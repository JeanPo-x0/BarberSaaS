from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SuscripcionResponse(BaseModel):
    id: int
    barberia_id: int
    plan: str
    estado: str
    periodo: str
    fecha_inicio: Optional[datetime]
    fecha_trial_fin: Optional[datetime]
    fecha_renovacion: Optional[datetime]
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    plan: str           # pro | premium
    periodo: str        # mensual | anual
    coupon: Optional[str] = None


class ListaEsperaCreate(BaseModel):
    barbero_id: Optional[int] = None
    servicio_id: Optional[int] = None
    cliente_nombre: str
    cliente_telefono: str
    fecha_preferida: Optional[datetime] = None


class ListaEsperaResponse(BaseModel):
    id: int
    barberia_id: int
    barbero_id: Optional[int]
    servicio_id: Optional[int]
    cliente_nombre: str
    cliente_telefono: str
    posicion: int
    estado: str
    creado_en: Optional[datetime]

    class Config:
        from_attributes = True
