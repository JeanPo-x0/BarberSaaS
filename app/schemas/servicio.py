from pydantic import BaseModel
from typing import Optional

class ServicioBase(BaseModel):
    nombre: str
    duracion_minutos: int
    precio: float
    barberia_id: int

class ServicioCreate(ServicioBase):
    pass

class ServicioUpdate(BaseModel):
    nombre: Optional[str] = None
    duracion_minutos: Optional[int] = None
    precio: Optional[float] = None

class ServicioResponse(ServicioBase):
    id: int
    disponible: bool = True

    class Config:
        from_attributes = True