from pydantic import BaseModel
from typing import Optional

class BarberiaBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    logo: Optional[str] = None
    plan: Optional[str] = "basico"

class BarberiaCreate(BarberiaBase):
    pass

class BarberiaResponse(BarberiaBase):
    id: int
    activa: bool
    subdominio: Optional[str] = None

    class Config:
        from_attributes = True