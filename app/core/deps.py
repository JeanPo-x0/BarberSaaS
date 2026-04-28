from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import verificar_token
from app.models.usuario import Usuario


def _extraer_token(request: Request) -> str | None:
    # 1. Authorization header tiene prioridad (onboarding tempToken, API, barberos)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    # 2. Cookie HTTP-only como fallback (sesiones de browser sin header explícito)
    return request.cookies.get("auth_token")


_ONBOARDING_ALLOWED_PATHS = {"/suscripcion/checkout", "/suscripcion/estado"}

def get_usuario_actual(request: Request, db: Session = Depends(get_db)):
    token = _extraer_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    payload = verificar_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    if payload.get("scope") == "onboarding" and request.url.path not in _ONBOARDING_ALLOWED_PATHS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token de onboarding no autorizado para este endpoint")
    usuario = db.query(Usuario).filter(Usuario.email == payload.get("sub")).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    if payload.get("rol") != usuario.rol:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    return usuario


def solo_dueno(usuario: Usuario = Depends(get_usuario_actual)):
    if usuario.rol != "dueno":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el dueno puede hacer esto")
    return usuario


def get_barbero_actual(request: Request, db: Session = Depends(get_db)):
    from app.models.barbero import Barbero
    # 1. Cookie HttpOnly (flujo seguro)
    token = request.cookies.get("barbero_token")
    # 2. Bearer header (fallback para clientes que aún tengan token en localStorage)
    if not token:
        auth = request.headers.get("Authorization", "")
        token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    payload = verificar_token(token)
    if not payload or payload.get("rol") != "barbero":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    barbero = db.query(Barbero).filter(Barbero.id == payload.get("barbero_id")).first()
    if not barbero or not barbero.cuenta_activa:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")
    return barbero
