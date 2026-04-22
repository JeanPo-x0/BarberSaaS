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
    email: Optional[str] = None
    cuenta_activa: bool = False

    class Config:
        from_attributes = True

class InvitarBarberoRequest(BaseModel):
    email: str

class ActivarBarberoRequest(BaseModel):
    token: str
    nueva_password: str

class LoginBarberoRequest(BaseModel):
    email: str
    password: str