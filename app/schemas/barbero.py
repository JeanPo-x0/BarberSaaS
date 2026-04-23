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

class BarberoPublicResponse(BaseModel):
    """Respuesta para endpoints públicos — omite teléfono y email del barbero."""
    id: int
    nombre: str
    especialidad: Optional[str] = None
    foto: Optional[str] = None
    barberia_id: int
    activo: bool

    class Config:
        from_attributes = True

class BarberoUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    especialidad: Optional[str] = None

    class Config:
        extra = "forbid"

class InvitarBarberoRequest(BaseModel):
    email: str

class ActivarBarberoRequest(BaseModel):
    token: str
    nueva_password: str

class LoginBarberoRequest(BaseModel):
    email: str
    password: str