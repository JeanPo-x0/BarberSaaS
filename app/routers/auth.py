from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas import UsuarioCreate, UsuarioResponse, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, crear_token

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

@router.post("/registro", response_model=UsuarioResponse)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="El email ya esta registrado")
    nuevo = Usuario(
        email=usuario.email,
        password_hash=hash_password(usuario.password),
        rol=usuario.rol,
        barberia_id=usuario.barberia_id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.post("/login", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contrasena incorrectos")
    token = crear_token({"sub": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id})
    return {"access_token": token, "token_type": "bearer"}
