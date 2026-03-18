from pydantic import BaseModel
from typing import Optional

class UsuarioCreate(BaseModel):
    email: str
    password: str
    rol: str
    barberia_id: Optional[int] = None

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
    token_type: str = "bearer"
