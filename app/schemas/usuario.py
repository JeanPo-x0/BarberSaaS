from pydantic import BaseModel
from typing import Optional

class UsuarioCreate(BaseModel):
    email: str
    password: str
    # rol ignorado — siempre se fuerza "cliente" server-side
    barberia_id: Optional[int] = None


class OnboardingCreate(BaseModel):
    email: str
    password: str
    nombre_barberia: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    plan: str = "basico"  # basico | pro | premium

class UsuarioResponse(BaseModel):
    id: int
    email: str
    rol: str
    barberia_id: Optional[int] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
