from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CitaBase(BaseModel):
    fecha_hora: datetime
    barbero_id: int
    servicio_id: int
    cliente_id: int

class CitaCreate(CitaBase):
    metodo_pago: Optional[str] = None
    servicios_ids: Optional[List[int]] = None  # si viene, servicio_id = servicios_ids[0]

# Modelos anidados para enriquecer la respuesta
class _ClienteBasico(BaseModel):
    id: int
    nombre: str
    telefono: Optional[str] = None
    class Config:
        from_attributes = True

class _BarberoBasico(BaseModel):
    id: int
    nombre: str
    especialidad: Optional[str] = None
    class Config:
        from_attributes = True

class _ServicioBasico(BaseModel):
    id: int
    nombre: str
    precio: float
    duracion_minutos: int
    class Config:
        from_attributes = True

class CitaResponse(CitaBase):
    id: int
    estado: str
    estado_pago: str = "exento"
    metodo_pago: Optional[str] = None
    comprobante_url: Optional[str] = None
    servicios_extra: Optional[list] = None
    cliente: Optional[_ClienteBasico] = None
    barbero: Optional[_BarberoBasico] = None
    servicio: Optional[_ServicioBasico] = None

    class Config:
        from_attributes = True