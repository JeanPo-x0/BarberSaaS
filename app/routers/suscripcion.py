from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.core.deps import get_usuario_actual
from app.models.usuario import Usuario
from app.models.barberia import Barberia
from app.models.suscripcion import Suscripcion
from app.schemas import SuscripcionResponse, CheckoutRequest
from app.services import stripe_service
from app.services.email import enviar_recibo_pago, enviar_aviso_suspension
import stripe as stripe_lib

router = APIRouter(prefix="/suscripcion", tags=["Suscripcion"])


def _get_suscripcion(barberia_id: int, db: Session) -> Suscripcion:
    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia_id).first()
    if not sus:
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada")
    return sus


@router.get("/coupon-earlyaccess")
def coupon_earlyaccess():
    """Retorna si el coupon EARLYACCESS sigue disponible (no llegó a 20 usos)."""
    try:
        import stripe
        coupon = stripe.Coupon.retrieve(settings.STRIPE_COUPON_EARLYACCESS)
        activo = coupon.valid and (coupon.times_redeemed < (coupon.max_redemptions or 20))
        return {"activo": activo, "usos": coupon.times_redeemed, "max": coupon.max_redemptions}
    except Exception:
        return {"activo": False, "usos": 0, "max": 20}


@router.get("/estado", response_model=SuscripcionResponse)
def estado_suscripcion(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    return _get_suscripcion(usuario.barberia_id, db)


@router.post("/checkout")
def crear_checkout(
    datos: CheckoutRequest,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    if datos.plan not in ("pro", "premium"):
        raise HTTPException(status_code=400, detail="Plan invalido")
    if datos.periodo not in ("mensual", "anual"):
        raise HTTPException(status_code=400, detail="Periodo invalido")

    barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()
    if not barberia:
        raise HTTPException(status_code=404, detail="Barberia no encontrada")

    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia.id).first()

    # Crear cliente Stripe si no existe
    es_nuevo = False
    if not sus or not sus.stripe_customer_id:
        customer_id = stripe_service.crear_cliente(barberia.email or usuario.email, barberia.nombre)
        if not sus:
            es_nuevo = True
            sus = Suscripcion(
                barberia_id=barberia.id,
                plan="basico",
                estado="trial",
                fecha_inicio=datetime.utcnow(),
                fecha_trial_fin=datetime.utcnow() + timedelta(days=14),
                stripe_customer_id=customer_id,
            )
            db.add(sus)
        else:
            sus.stripe_customer_id = customer_id
        db.commit()
        db.refresh(sus)
    # Ya tiene suscripción: no es cliente nuevo, no aplica trial
    elif sus.estado in ("trial",):
        es_nuevo = True  # aún en trial: mantiene los días restantes

    url = stripe_service.crear_checkout_session(
        customer_id=sus.stripe_customer_id,
        plan=datos.plan,
        periodo=datos.periodo,
        barberia_id=barberia.id,
        coupon=datos.coupon,
        es_nuevo=es_nuevo,
    )
    return {"checkout_url": url}


@router.post("/cancelar")
def cancelar_suscripcion(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    sus = _get_suscripcion(usuario.barberia_id, db)
    if not sus.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No hay suscripcion activa para cancelar")
    stripe_service.cancelar_suscripcion(sus.stripe_subscription_id)
    sus.estado = "cancelacion_pendiente"
    db.commit()
    return {"ok": True, "mensaje": "Suscripcion programada para cancelar al final del periodo. Podés seguir usando la plataforma hasta esa fecha."}


@router.post("/reactivar")
def reactivar_suscripcion(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    sus = _get_suscripcion(usuario.barberia_id, db)
    if sus.estado != "cancelacion_pendiente" or not sus.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No hay cancelacion pendiente para revertir")
    stripe_service.reactivar_suscripcion(sus.stripe_subscription_id)
    sus.estado = "activa"
    db.commit()
    return {"ok": True, "mensaje": "Suscripcion reactivada correctamente."}


@router.post("/sincronizar")
def sincronizar_desde_checkout(
    datos: dict,
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Sincroniza la suscripción local con Stripe usando el session_id del checkout."""
    import stripe as stripe_lib
    session_id = datos.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requerido")

    try:
        session = stripe_lib.checkout.Session.retrieve(
            session_id, expand=["subscription", "subscription.items.data.price"]
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Session invalida")

    sub = session.get("subscription")
    if not sub or isinstance(sub, str):
        raise HTTPException(status_code=400, detail="No hay suscripcion en este session")

    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == usuario.barberia_id).first()
    if not sus:
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada")

    meta = sub.get("metadata", {})
    plan = meta.get("plan") or session.get("metadata", {}).get("plan", "pro")
    if plan not in ("pro", "premium"):
        plan = "pro"

    status = sub.get("status")
    items = sub.get("items", {}).get("data", [])
    interval = items[0]["price"]["recurring"]["interval"] if items else "month"

    sus.stripe_subscription_id = sub["id"]
    sus.stripe_price_id = items[0]["price"]["id"] if items else sus.stripe_price_id
    sus.plan = plan
    sus.periodo = "anual" if interval == "year" else "mensual"

    barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()

    if status == "trialing":
        sus.estado = "trial"
        trial_end = sub.get("trial_end")
        if trial_end:
            sus.fecha_trial_fin = datetime.utcfromtimestamp(trial_end)
        if barberia:
            barberia.plan = plan
            barberia.activa = True
    elif status == "active":
        sus.estado = "activa"
        if barberia:
            barberia.plan = plan
            barberia.activa = True

    ts = sub.get("current_period_end")
    if ts:
        sus.fecha_renovacion = datetime.utcfromtimestamp(ts)

    db.commit()
    return {"ok": True, "plan": plan, "estado": sus.estado}


@router.get("/portal")
def portal_billing(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    sus = _get_suscripcion(usuario.barberia_id, db)
    if not sus.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No tienes metodo de pago configurado")
    url = stripe_service.crear_portal_session(sus.stripe_customer_id, sus.barberia_id)
    return {"portal_url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        evento = stripe_service.construir_evento_webhook(payload, sig_header)
    except Exception:
        raise HTTPException(status_code=400, detail="Webhook invalido")

    tipo = evento["type"]
    data = evento["data"]["object"]

    # Suscripción activada (trial o pago exitoso)
    if tipo in ("customer.subscription.created", "customer.subscription.updated"):
        sub_id = data["id"]
        status = data["status"]
        barberia_id = int(data.get("metadata", {}).get("barberia_id", 0))
        if barberia_id <= 0:
            return {"ok": False, "razon": "barberia_id invalido"}
        plan = data.get("metadata", {}).get("plan", "pro")
        PLANES_VALIDOS = {"basico", "pro", "premium"}
        if plan not in PLANES_VALIDOS:
            plan = "pro"

        sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia_id).first()
        if sus:
            sus.stripe_subscription_id = sub_id
            sus.stripe_price_id = data["items"]["data"][0]["price"]["id"]
            sus.plan = plan
            periodo_interval = data["items"]["data"][0]["price"]["recurring"]["interval"]
            sus.periodo = "anual" if periodo_interval == "year" else "mensual"
            cancel_at_end = data.get("cancel_at_period_end", False)

            barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()

            if status == "trialing":
                # Suscripción nueva en período de prueba — actualizar plan pero mantener estado trial
                sus.estado = "trial"
                trial_end_ts = data.get("trial_end")
                if trial_end_ts:
                    sus.fecha_trial_fin = datetime.utcfromtimestamp(trial_end_ts)
                if barberia:
                    barberia.plan = plan
                    barberia.activa = True
            elif status == "active" and cancel_at_end:
                sus.estado = "cancelacion_pendiente"
                if barberia:
                    barberia.plan = plan
                    barberia.activa = True
            elif status == "active":
                sus.estado = "activa"
                if barberia:
                    barberia.plan = plan
                    barberia.activa = True
            elif status in ("past_due", "unpaid", "canceled"):
                sus.estado = "suspendida"
                if barberia:
                    barberia.activa = False
                    try:
                        enviar_aviso_suspension(barberia.email, barberia.nombre)
                    except Exception:
                        pass

            ts = data.get("current_period_end")
            if ts:
                sus.fecha_renovacion = datetime.utcfromtimestamp(ts)
            db.commit()

    # Pago exitoso → recibo por email
    elif tipo == "invoice.payment_succeeded":
        customer_id = data.get("customer")
        monto = (data.get("amount_paid", 0) or 0) / 100
        sus = db.query(Suscripcion).filter(Suscripcion.stripe_customer_id == customer_id).first()
        if sus:
            barberia = db.query(Barberia).filter(Barberia.id == sus.barberia_id).first()
            if barberia and barberia.email and monto > 0:
                try:
                    fecha = datetime.utcnow().strftime("%d/%m/%Y")
                    enviar_recibo_pago(barberia.email, barberia.nombre, sus.plan, monto, sus.periodo, fecha)
                except Exception:
                    pass

    # Pago fallido → suspender
    elif tipo == "invoice.payment_failed":
        customer_id = data.get("customer")
        sus = db.query(Suscripcion).filter(Suscripcion.stripe_customer_id == customer_id).first()
        if sus:
            sus.estado = "suspendida"
            barberia = db.query(Barberia).filter(Barberia.id == sus.barberia_id).first()
            if barberia:
                barberia.activa = False
                try:
                    enviar_aviso_suspension(barberia.email, barberia.nombre)
                except Exception:
                    pass
            db.commit()

    # Suscripción cancelada
    elif tipo == "customer.subscription.deleted":
        sub_id = data["id"]
        sus = db.query(Suscripcion).filter(Suscripcion.stripe_subscription_id == sub_id).first()
        if sus:
            sus.estado = "cancelada"
            sus.plan = "basico"
            barberia = db.query(Barberia).filter(Barberia.id == sus.barberia_id).first()
            if barberia:
                barberia.plan = "basico"
                barberia.activa = False
            db.commit()

    return {"ok": True}
