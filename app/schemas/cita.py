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

class CitaResponse(CitaBase):
    id: int
    estado: str

    class Config:
        from_attributes = True