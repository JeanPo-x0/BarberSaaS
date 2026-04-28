import os
import re
import secrets
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.models.password_reset import PasswordResetToken
from app.models.email_verification import EmailVerificationToken
from app.schemas import UsuarioCreate, UsuarioResponse, LoginRequest, TokenResponse, OnboardingCreate, OnboardingResponse
from app.core.security import hash_password, verify_password, crear_token, crear_refresh_token, verificar_token
import re as _re
from app.core.config import settings
from app.core.deps import get_usuario_actual
from app.services.email import enviar_reset_password, enviar_bienvenida, enviar_verificacion_email
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


def _crear_token_verificacion(email: str, db: Session) -> str:
    # No invalidamos tokens anteriores — el usuario puede usar cualquier email recibido
    token_plano = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_plano.encode()).hexdigest()
    db.add(EmailVerificationToken(
        email=email,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    ))
    db.commit()
    return token_plano

class EmailRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    nueva_password: str

@router.post("/registro", response_model=UsuarioResponse)
@limiter.limit("5/minute")
def registrar_usuario(request: Request, usuario: UsuarioCreate, db: Session = Depends(get_db)):
    email = sanitizar(usuario.email).lower()
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
@limiter.limit("3/minute")
def login(request: Request, response: Response, datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email.lower().strip()).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")
    if not usuario.email_verificado:
        raise HTTPException(status_code=403, detail="EMAIL_NO_VERIFICADO")
    token_payload = {"sub": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id}
    access_token = crear_token(token_payload)
    response.set_cookie(
        key="auth_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {
        "access_token": access_token,
        "refresh_token": crear_refresh_token(token_payload),
        "token_type": "bearer",
        "usuario": {"id": usuario.id, "email": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id},
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="auth_token", httponly=True, secure=True, samesite="none")
    return {"ok": True}

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

@router.post("/onboarding", response_model=OnboardingResponse)
@limiter.limit("3/hour")
@limiter.limit("2/minute")
def onboarding(request: Request, datos: OnboardingCreate, db: Session = Depends(get_db)):
    """Registro completo: crea usuario dueño + barbería + suscripción trial."""
    email = sanitizar(datos.email).lower()
    validar_password(datos.password)
    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente:
        # Bloquear solo si ya tiene suscripción pagada (stripe_subscription_id presente)
        sus_existente = db.query(Suscripcion).filter(Suscripcion.barberia_id == existente.barberia_id).first() if existente.barberia_id else None
        ha_pagado = bool(sus_existente and sus_existente.stripe_subscription_id)
        if ha_pagado:
            raise HTTPException(status_code=400, detail="Datos de registro invalidos")
        # Sin pago completado — limpiar cuenta incompleta y permitir re-registro
        if existente.barberia_id:
            bid = existente.barberia_id
            # Romper FKs circulares antes de borrar (usuario.barberia_id <-> barberia.dueno_id)
            barberia_existente = db.query(Barberia).filter(Barberia.id == bid).first()
            if barberia_existente:
                barberia_existente.dueno_id = None
            existente.barberia_id = None
            db.flush()
            db.query(Suscripcion).filter(Suscripcion.barberia_id == bid).delete(synchronize_session=False)
            db.query(EmailVerificationToken).filter(EmailVerificationToken.email == email).delete(synchronize_session=False)
            db.delete(existente)
            if barberia_existente:
                db.delete(barberia_existente)
        else:
            db.query(EmailVerificationToken).filter(EmailVerificationToken.email == email).delete(synchronize_session=False)
            db.delete(existente)
        db.flush()

    # Crear barbería — inactiva hasta que Stripe confirme el pago
    barberia = Barberia(
        nombre=sanitizar(datos.nombre_barberia),
        direccion=sanitizar(datos.direccion) if datos.direccion else None,
        telefono=datos.telefono,
        email=datos.email,
        plan="basico",
        activa=False,
    )
    db.add(barberia)
    db.flush()  # obtener barberia.id sin commit

    # Suscripción pendiente — se activa cuando Stripe confirma el pago
    suscripcion = Suscripcion(
        barberia_id=barberia.id,
        plan="basico",
        estado="pendiente_pago",
        fecha_inicio=datetime.utcnow(),
    )
    db.add(suscripcion)

    # Crear usuario dueño — pendiente de verificación de email
    usuario = Usuario(
        email=email,
        password_hash=hash_password(datos.password),
        rol="dueno",
        barberia_id=barberia.id,
        email_verificado=False,
    )
    db.add(usuario)
    db.flush()

    barberia.dueno_id = usuario.id
    db.commit()
    db.refresh(usuario)

    # El email de verificación se envía DESPUÉS de confirmar el pago en /suscripcion/sincronizar

    # Devolver token temporal para que el frontend pueda ir directo a Stripe
    # sin pasar por /auth/login (que bloquea emails no verificados)
    token_payload = {"sub": usuario.email, "rol": usuario.rol, "barberia_id": usuario.barberia_id}
    access_token = crear_token(token_payload)
    return {
        "id": usuario.id,
        "email": usuario.email,
        "rol": usuario.rol,
        "barberia_id": usuario.barberia_id,
        "access_token": access_token,
    }


@router.get("/verificar-email")
def verificar_email(token: str, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    registro = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token_hash == token_hash,
        EmailVerificationToken.usado == False,
        EmailVerificationToken.expires_at > datetime.utcnow()
    ).first()
    if not registro:
        raise HTTPException(status_code=400, detail="Token invalido o expirado")
    usuario = db.query(Usuario).filter(Usuario.email == registro.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.email_verificado = True
    registro.usado = True
    db.commit()
    return {"ok": True, "mensaje": "Email verificado correctamente"}


@router.post("/reenviar-verificacion")
@limiter.limit("3/minute")
def reenviar_verificacion(request: Request, datos: EmailRequest, db: Session = Depends(get_db)):
    import stripe as stripe_lib
    email = datos.email.lower().strip()
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or usuario.email_verificado:
        return {"mensaje": "Si el email existe y no está verificado, recibirás un correo"}

    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == usuario.barberia_id).first() if usuario.barberia_id else None
    ha_pagado = bool(sus and sus.estado in ("activa", "trial"))
    print(f"[reenviar] email={email} ha_pagado={ha_pagado} estado_db={sus and sus.estado}", flush=True)

    # Fallback: si DB dice pendiente_pago, verificar en Stripe por si el sync no llegó
    if not ha_pagado and sus and usuario.barberia_id:
        try:
            import stripe as stripe_lib
            customers = stripe_lib.Customer.list(email=email, limit=1)
            print(f"[reenviar] stripe customers encontrados: {len(customers.data)}", flush=True)
            if customers.data:
                customer_id = customers.data[0].id
                subs = stripe_lib.Subscription.list(customer=customer_id, limit=5)
                print(f"[reenviar] suscripciones stripe: {[s.status for s in subs.data]}", flush=True)
                active_sub = next((s for s in subs.data if s.status in ("active", "trialing")), None)
                if active_sub:
                    sus.stripe_customer_id = customer_id
                    sus.stripe_subscription_id = active_sub.id
                    sus.estado = "trial" if active_sub.status == "trialing" else "activa"
                    sub_meta = getattr(active_sub, "metadata", None)
                    sus.plan = getattr(sub_meta, "plan", None) or "pro"
                    barberia_obj = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()
                    if barberia_obj:
                        barberia_obj.activa = True
                        barberia_obj.plan = sus.plan
                    db.commit()
                    ha_pagado = True
        except Exception as e:
            print(f"[reenviar] ERROR stripe fallback: {e}", flush=True)

    if not ha_pagado:
        print(f"[reenviar] no ha pagado — no se envia email", flush=True)
        return {"mensaje": "Si el email existe y no está verificado, recibirás un correo"}

    try:
        token_plano = _crear_token_verificacion(email, db)
        enviar_verificacion_email(email, token_plano, settings.FRONTEND_URL)
        print(f"[reenviar] email enviado OK a {email}", flush=True)
    except Exception as e:
        print(f"[reenviar] ERROR enviando email: {e}", flush=True)
    return {"mensaje": "Si el email existe y no está verificado, recibirás un correo"}


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

class CambiarPasswordRequest(BaseModel):
    password_actual: str
    nueva_password: str

@router.patch("/cambiar-password")
def cambiar_password(
    datos: CambiarPasswordRequest,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    if not verify_password(datos.password_actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")
    validar_password(datos.nueva_password)
    if datos.password_actual == datos.nueva_password:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser diferente a la actual")
    usuario.password_hash = hash_password(datos.nueva_password)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente"}


@router.post("/reset-password")
@limiter.limit("5/hour")
def reset_password(request: Request, datos: ResetPasswordRequest, db: Session = Depends(get_db)):
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
