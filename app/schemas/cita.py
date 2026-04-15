from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CitaBase(BaseModel):
    fecha_hora: datetime
    barbero_id: int
    servicio_id: int
    cliente_id: int

class CitaCreate(CitaBase):
    pass

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
    cliente: Optional[_ClienteBasico] = None
    barbero: Optional[_BarberoBasico] = None
    servicio: Optional[_ServicioBasico] = None

    class Config:
        from_attributes = True