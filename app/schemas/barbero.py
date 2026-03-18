from pydantic import BaseModel
from typing import Optional

class BarberoBase(BaseModel):
    nombre: str
    telefono: Optional[str] = None
    especialidad: Optional[str] = None
    foto: Optional[str] = None
    barberia_id: int

class BarberoCreate(BarberoBase):
    pass

class BarberoResponse(BarberoBase):
    id: int
    activo: bool

    class Config:
        from_attributes = True