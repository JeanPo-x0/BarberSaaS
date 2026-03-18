from pydantic import BaseModel
from typing import Optional

class ServicioBase(BaseModel):
    nombre: str
    duracion_minutos: int
    precio: float
    barberia_id: int

class ServicioCreate(ServicioBase):
    pass

class ServicioResponse(ServicioBase):
    id: int

    class Config:
        from_attributes = True