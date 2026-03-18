from pydantic import BaseModel
from typing import Optional

class BarberiaBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

class BarberiaCreate(BarberiaBase):
    pass

class BarberiaResponse(BarberiaBase):
    id: int
    activa: bool

    class Config:
        from_attributes = True