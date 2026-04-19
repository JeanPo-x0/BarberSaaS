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
from app.core.security import hash_password, verify_password, crear_token, crear_refresh_token, verificar_token
import re as _re
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

_HTML_RE = _re.compile(r'<[^>]+>')

def sanitizar(texto: str) -> str:
    """Elimina tags HTML del input del usuario."""
    return _HTML_RE.sub('', texto).strip() if texto else texto

def validar_password(password: str):
    """Valida: 8-64 chars, 1 mayúscula, 1 especial."""
    if len(password) < 8 or len(password) > 64:
        raise HTTPException(status_code=400, detail="Password no cumple requisitos de seguridad")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password no cumple requisitos de seguridad")
    if not re.search(r"[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/\\]", password):
        raise HTTPException(status_code=400, detail="Password no cumple requisitos de seguridad")

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
    email = sanitizar(usuario.email).lower()
    validar_dominio_email(email)
    validar_password(usuario.password)
    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Datos de registro invalidos")
    nuevo = Usuario(
        email=email,
        password_hash=hash_password(usuario.password),
        rol="cliente",   # siempre cliente — nunca desde el input
        barberia_id=usuario.barberia_id
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


class PromoverRequest(BaseModel):
    email: str
    nuevo_rol: str

@router.post("/admin/promover")
def promover_usuario(datos: PromoverRequest, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    """Solo superadmin puede cambiar roles."""
    if usuario.email != settings.SUPERADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Sin permisos")
    ROLES_VALIDOS = {"cliente", "dueno", "barbero", "superadmin"}
    if datos.nuevo_rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol invalido")
    target = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    target.rol = datos.nuevo_rol
    db.commit()
    return {"mensaje": f"Rol actualizado a {datos.nuevo_rol}"}

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email.lower().strip()).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")
    payload = {"sub": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id}
    return {
        "access_token": crear_token(payload),
        "refresh_token": crear_refresh_token(payload),
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh(datos: RefreshRequest, db: Session = Depends(get_db)):
    payload = verificar_token(datos.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token invalido")
    usuario = db.query(Usuario).filter(Usuario.email == payload.get("sub")).first()
    if not usuario or payload.get("rol") != usuario.rol:
        raise HTTPException(status_code=401, detail="Refresh token invalido")
    new_payload = {"sub": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id}
    return {
        "access_token": crear_token(new_payload),
        "refresh_token": crear_refresh_token(new_payload),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UsuarioResponse)
def me(usuario: Usuario = Depends(get_usuario_actual)):
    return usuario

@router.post("/onboarding", response_model=UsuarioResponse)
@limiter.limit("5/minute")
def onboarding(request: Request, datos: OnboardingCreate, db: Session = Depends(get_db)):
    """Registro completo: crea usuario dueño + barbería + suscripción trial."""
    email = sanitizar(datos.email).lower()
    validar_dominio_email(email)
    validar_password(datos.password)
    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Datos de registro invalidos")

    # Crear barbería — plan siempre basico al registrarse, se sube via Stripe
    barberia = Barberia(
        nombre=sanitizar(datos.nombre_barberia),
        direccion=sanitizar(datos.direccion) if datos.direccion else None,
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
        email=email,
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
    datos.email = email  # normalizar para el email de bienvenida
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
