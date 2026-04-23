from fastapi import APIRouter, Depends, HTTPException, Request
from app.core.limiter import limiter
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.barbero import Barbero
from app.models.usuario import Usuario
from app.schemas import BarberoCreate, BarberoResponse, BarberoPublicResponse
from app.schemas.barbero import InvitarBarberoRequest, ActivarBarberoRequest, LoginBarberoRequest, BarberoUpdate
from app.core.deps import get_usuario_actual, get_barbero_actual
from app.core.security import hash_password, verify_password, crear_token
from app.utils.phone import formatear_telefono
from app.services.email import enviar_invitacion_barbero
from app.core.config import settings
from typing import List
import hashlib, secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/barberos", tags=["Barberos"])

@router.post("/", response_model=BarberoResponse)
def crear_barbero(
    barbero: BarberoCreate,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    from app.models.barberia import Barberia
    barberia = db.query(Barberia).filter(
        Barberia.id == barbero.barberia_id,
        Barberia.dueno_id == usuario.id,
    ).first()
    if not barberia:
        barberia = db.query(Barberia).filter(
            Barberia.id == barbero.barberia_id,
            Barberia.id == usuario.barberia_id,
        ).first()
    if not barberia:
        raise HTTPException(status_code=403, detail="No tienes permiso sobre esa barberia")
    datos = barbero.model_dump()
    if datos.get('telefono'):
        datos['telefono'] = formatear_telefono(datos['telefono'])
    nuevo = Barbero(**datos)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/mios", response_model=List[BarberoResponse])
def mis_barberos(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    if not usuario.barberia_id:
        return []
    return db.query(Barbero).filter(Barbero.barberia_id == usuario.barberia_id).all()

@router.get("/barberia/{barberia_id}", response_model=List[BarberoPublicResponse])
def barberos_por_barberia(barberia_id: int, db: Session = Depends(get_db)):
    return db.query(Barbero).filter(Barbero.barberia_id == barberia_id).all()

@router.patch("/{barbero_id}/toggle", response_model=BarberoResponse)
def toggle_barbero(barbero_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(
        Barbero.id == barbero_id,
        Barbero.barberia_id == usuario.barberia_id
    ).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    barbero.activo = not barbero.activo
    db.commit()
    db.refresh(barbero)
    return barbero

@router.delete("/{barbero_id}")
def eliminar_barbero(barbero_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    from app.models.cita import Cita
    from datetime import datetime
    barbero = db.query(Barbero).filter(
        Barbero.id == barbero_id,
        Barbero.barberia_id == usuario.barberia_id
    ).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    citas_futuras = db.query(Cita).filter(
        Cita.barbero_id == barbero_id,
        Cita.estado == "pendiente",
        Cita.fecha_hora > datetime.utcnow()
    ).count()
    if citas_futuras > 0:
        raise HTTPException(status_code=400, detail=f"El barbero tiene {citas_futuras} cita(s) pendiente(s). Cancelalas antes de eliminar.")
    db.delete(barbero)
    db.commit()
    return {"ok": True}

@router.get("/", response_model=List[BarberoResponse])
def listar_barberos(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Solo devuelve los barberos de la barbería del usuario logueado."""
    return db.query(Barbero).filter(Barbero.barberia_id == usuario.barberia_id).all()

@router.get("/{barbero_id}", response_model=BarberoPublicResponse)
def obtener_barbero(barbero_id: int, db: Session = Depends(get_db)):
    barbero = db.query(Barbero).filter(Barbero.id == barbero_id).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    return barbero


@router.post("/{barbero_id}/invitar")
def invitar_barbero(
    barbero_id: int,
    datos: InvitarBarberoRequest,
    request: Request,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    barbero = db.query(Barbero).filter(
        Barbero.id == barbero_id,
        Barbero.barberia_id == usuario.barberia_id,
    ).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")

    email = datos.email.lower().strip()
    conflicto = db.query(Barbero).filter(
        Barbero.email == email,
        Barbero.id != barbero_id,
    ).first()
    if conflicto:
        raise HTTPException(status_code=400, detail="Ese email ya está en uso por otro barbero")

    token_raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_raw.encode()).hexdigest()

    barbero.email = email
    barbero.inv_token_hash = token_hash
    barbero.inv_token_expires = datetime.utcnow() + timedelta(hours=48)
    barbero.cuenta_activa = False
    db.commit()

    from app.models.barberia import Barberia
    barberia = db.query(Barberia).filter(Barberia.id == barbero.barberia_id).first()
    base_url = settings.FRONTEND_URL
    try:
        enviar_invitacion_barbero(email, barbero.nombre, barberia.nombre if barberia else "tu barbería", token_raw, base_url)
    except Exception as e:
        print(f"[Email] ERROR enviando invitación: {e}")

    return {"ok": True, "mensaje": f"Invitación enviada a {email}"}


@router.post("/activar")
@limiter.limit("5/hour")
def activar_cuenta_barbero(request: Request, datos: ActivarBarberoRequest, db: Session = Depends(get_db)):
    from app.routers.auth import validar_password
    token_hash = hashlib.sha256(datos.token.encode()).hexdigest()
    barbero = db.query(Barbero).filter(Barbero.inv_token_hash == token_hash).first()
    if not barbero:
        raise HTTPException(status_code=400, detail="Link inválido o expirado")
    if barbero.inv_token_expires and datetime.utcnow() > barbero.inv_token_expires:
        raise HTTPException(status_code=400, detail="El link expiró. Pedile al dueño que te reenvíe la invitación.")
    validar_password(datos.nueva_password)
    barbero.password_hash = hash_password(datos.nueva_password)
    barbero.cuenta_activa = True
    barbero.inv_token_hash = None
    barbero.inv_token_expires = None
    db.commit()
    return {"ok": True, "mensaje": "Cuenta activada. Ya podés iniciar sesión."}


@router.post("/login")
@limiter.limit("3/minute")
def login_barbero(request: Request, datos: LoginBarberoRequest, db: Session = Depends(get_db)):
    email = datos.email.lower().strip()
    barbero = db.query(Barbero).filter(Barbero.email == email).first()
    if not barbero or not barbero.password_hash or not verify_password(datos.password, barbero.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not barbero.cuenta_activa:
        raise HTTPException(status_code=403, detail="Cuenta no activada. Revisá tu email.")
    payload = {"sub": barbero.email, "rol": "barbero", "barbero_id": barbero.id, "barberia_id": barbero.barberia_id, "nombre": barbero.nombre}
    token = crear_token(payload)
    from fastapi.responses import JSONResponse
    response = JSONResponse({
        "access_token": token,
        "token_type": "bearer",
        "barbero": {"id": barbero.id, "nombre": barbero.nombre, "email": barbero.email, "barberia_id": barbero.barberia_id},
    })
    response.delete_cookie(key="auth_token", httponly=True, secure=True, samesite="none")
    return response


@router.patch("/{barbero_id}/editar", response_model=BarberoResponse)
def editar_barbero(
    barbero_id: int,
    datos: BarberoUpdate,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    barbero = db.query(Barbero).filter(
        Barbero.id == barbero_id,
        Barbero.barberia_id == usuario.barberia_id,
    ).first()
    if not barbero:
        raise HTTPException(status_code=404, detail="Barbero no encontrado")
    if datos.nombre is not None:
        barbero.nombre = datos.nombre
    if datos.telefono is not None:
        barbero.telefono = formatear_telefono(datos.telefono) if datos.telefono else None
    if datos.especialidad is not None:
        barbero.especialidad = datos.especialidad
    db.commit()
    db.refresh(barbero)
    return barbero


@router.get("/me/historial")
def historial_barbero(barbero: Barbero = Depends(get_barbero_actual), db: Session = Depends(get_db)):
    from app.models.cita import Cita
    from app.models.cliente import Cliente
    from app.models.servicio import Servicio
    hace_30 = datetime.utcnow() - timedelta(days=30)
    citas = (
        db.query(Cita)
        .filter(Cita.barbero_id == barbero.id, Cita.fecha_hora >= hace_30)
        .order_by(Cita.fecha_hora.desc())
        .limit(50)
        .all()
    )
    resultado = []
    for c in citas:
        cliente = db.query(Cliente).filter(Cliente.id == c.cliente_id).first()
        servicio = db.query(Servicio).filter(Servicio.id == c.servicio_id).first()
        resultado.append({
            "id": c.id,
            "fecha_hora": c.fecha_hora.isoformat(),
            "estado": c.estado,
            "cliente": {"nombre": cliente.nombre} if cliente else None,
            "servicio": {"nombre": servicio.nombre, "precio": servicio.precio} if servicio else None,
            "servicios_extra": c.servicios_extra,
        })
    return resultado


@router.patch("/me/perfil")
def actualizar_perfil_barbero(datos: BarberoUpdate, barbero: Barbero = Depends(get_barbero_actual), db: Session = Depends(get_db)):
    if datos.nombre is not None:
        barbero.nombre = datos.nombre
    if datos.telefono is not None:
        barbero.telefono = formatear_telefono(datos.telefono) if datos.telefono else None
    if datos.especialidad is not None:
        barbero.especialidad = datos.especialidad
    db.commit()
    db.refresh(barbero)
    return {"ok": True, "nombre": barbero.nombre, "telefono": barbero.telefono, "especialidad": barbero.especialidad}


@router.get("/me/agenda")
def agenda_barbero(barbero: Barbero = Depends(get_barbero_actual), db: Session = Depends(get_db)):
    from app.models.cita import Cita
    from app.models.cliente import Cliente
    from app.models.servicio import Servicio
    from datetime import timezone
    ahora = datetime.utcnow()
    inicio_hoy = ahora.replace(hour=0, minute=0, second=0, microsecond=0)
    fin_semana = inicio_hoy + timedelta(days=7)
    citas = (
        db.query(Cita)
        .filter(
            Cita.barbero_id == barbero.id,
            Cita.fecha_hora >= inicio_hoy,
            Cita.fecha_hora < fin_semana,
            Cita.estado != "cancelada",
        )
        .order_by(Cita.fecha_hora)
        .all()
    )
    resultado = []
    for c in citas:
        cliente = db.query(Cliente).filter(Cliente.id == c.cliente_id).first()
        servicio = db.query(Servicio).filter(Servicio.id == c.servicio_id).first()
        resultado.append({
            "id": c.id,
            "fecha_hora": c.fecha_hora.isoformat(),
            "estado": c.estado,
            "cliente": {"nombre": cliente.nombre, "telefono": cliente.telefono} if cliente else None,
            "servicio": {"nombre": servicio.nombre, "precio": servicio.precio} if servicio else None,
        })
    return resultado
