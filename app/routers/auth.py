import os
import re
import secrets
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.models.password_reset import PasswordResetToken
from app.schemas import UsuarioCreate, UsuarioResponse, LoginRequest, TokenResponse, OnboardingCreate
from app.core.security import hash_password, verify_password, crear_token
from app.core.config import settings
from app.core.deps import get_usuario_actual
from app.services.email import enviar_reset_password, enviar_bienvenida
from app.core.limiter import limiter

# ── Dominios de email permitidos ─────────────────────────────
DOMINIOS_PERMITIDOS = {
    # Google
    "gmail.com", "googlemail.com",
    # Microsoft
    "hotmail.com", "hotmail.es", "hotmail.co.cr", "hotmail.com.ar",
    "outlook.com", "outlook.es", "outlook.co.cr",
    "live.com", "live.co.cr", "live.es",
    "msn.com",
    # Yahoo
    "yahoo.com", "yahoo.es", "yahoo.co.cr", "yahoo.com.ar", "yahoo.com.mx",
    # Apple
    "icloud.com", "me.com", "mac.com",
    # Otros comunes
    "aol.com", "zoho.com",
}

def validar_password(password: str):
    """Valida: 8-64 chars, 1 mayúscula, 1 especial. Lanza HTTPException si no cumple."""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="La contrasena debe tener al menos 8 caracteres")
    if len(password) > 64:
        raise HTTPException(status_code=400, detail="La contrasena no puede superar los 64 caracteres")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="La contrasena debe tener al menos una letra mayuscula")
    if not re.search(r"[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\]", password):
        raise HTTPException(status_code=400, detail="La contrasena debe tener al menos un caracter especial (!@#$%...)")

def validar_dominio_email(email: str):
    """Solo permite dominios de email convencionales. Bloquea proveedores de privacidad."""
    partes = email.lower().strip().split("@")
    if len(partes) != 2 or not partes[1]:
        raise HTTPException(status_code=400, detail="Email invalido")
    dominio = partes[1]
    if dominio not in DOMINIOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Solo se permiten emails de proveedores convencionales (Gmail, Hotmail, Outlook, Yahoo, iCloud)"
        )

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

class EmailRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    nueva_password: str

@router.post("/registro", response_model=UsuarioResponse)
@limiter.limit("5/minute")
def registrar_usuario(request: Request, usuario: UsuarioCreate, db: Session = Depends(get_db)):
    validar_dominio_email(usuario.email)
    validar_password(usuario.password)
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
@limiter.limit("10/minute")
def login(request: Request, datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contrasena incorrectos")
    token = crear_token({"sub": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UsuarioResponse)
def me(usuario: Usuario = Depends(get_usuario_actual)):
    return usuario

@router.post("/onboarding", response_model=UsuarioResponse)
@limiter.limit("5/minute")
def onboarding(request: Request, datos: OnboardingCreate, db: Session = Depends(get_db)):
    """Registro completo: crea usuario dueño + barbería + suscripción trial."""
    validar_dominio_email(datos.email)
    validar_password(datos.password)
    existente = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="El email ya esta registrado")

    # Crear barbería — plan siempre basico al registrarse, se sube via Stripe
    barberia = Barberia(
        nombre=datos.nombre_barberia,
        direccion=datos.direccion,
        telefono=datos.telefono,
        email=datos.email,
        plan="basico",
        activa=True,
    )
    db.add(barberia)
    db.flush()  # obtener barberia.id sin commit

    # Crear suscripción trial 14 días
    suscripcion = Suscripcion(
        barberia_id=barberia.id,
        plan="basico",
        estado="trial",
        fecha_inicio=datetime.utcnow(),
        fecha_trial_fin=datetime.utcnow() + timedelta(days=14),
    )
    db.add(suscripcion)

    # Crear usuario dueño
    usuario = Usuario(
        email=datos.email,
        password_hash=hash_password(datos.password),
        rol="dueno",
        barberia_id=barberia.id,
    )
    db.add(usuario)
    db.flush()  # get usuario.id

    # Link the barbershop to its owner
    barberia.dueno_id = usuario.id
    db.commit()
    db.refresh(usuario)

    # Email de bienvenida
    link_agendamiento = f"{settings.FRONTEND_URL}/agendar/{barberia.id}"
    try:
        enviar_bienvenida(datos.email, datos.nombre_barberia, link_agendamiento)
    except Exception:
        pass  # No bloquear el registro si el email falla

    return usuario


@router.post("/recuperar-password")
@limiter.limit("5/minute")
def recuperar_password(request: Request, datos: EmailRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    # Siempre responder igual para no revelar si el email existe
    if not usuario:
        return {"mensaje": "Si el email existe, recibiras un correo con instrucciones"}

    # Generar token seguro y guardarlo hasheado
    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode()).hexdigest()
    expira = datetime.utcnow() + timedelta(minutes=15)

    # Invalidar tokens anteriores del mismo email
    db.query(PasswordResetToken).filter(
        PasswordResetToken.email == datos.email,
        PasswordResetToken.usado == False
    ).update({"usado": True})

    nuevo_token = PasswordResetToken(
        email=datos.email,
        token_hash=token_hash,
        expires_at=expira
    )
    db.add(nuevo_token)
    db.commit()

    try:
        enviar_reset_password(datos.email, token_plano, settings.FRONTEND_URL)
    except Exception:
        pass  # No revelar si el email existe o si el envío falló

    return {"mensaje": "Si el email existe, recibiras un correo con instrucciones"}

@router.post("/reset-password")
def reset_password(datos: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(datos.token.encode()).hexdigest()

    registro = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.usado == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not registro:
        raise HTTPException(status_code=400, detail="Token invalido o expirado")

    validar_password(datos.nueva_password)

    usuario = db.query(Usuario).filter(Usuario.email == registro.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.password_hash = hash_password(datos.nueva_password)
    registro.usado = True
    db.commit()

    return {"mensaje": "Contrasena actualizada correctamente"}
