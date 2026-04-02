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
    if not sus or not sus.stripe_customer_id:
        customer_id = stripe_service.crear_cliente(barberia.email or usuario.email, barberia.nombre)
        if not sus:
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

    url = stripe_service.crear_checkout_session(
        customer_id=sus.stripe_customer_id,
        plan=datos.plan,
        periodo=datos.periodo,
        barberia_id=barberia.id,
        coupon=datos.coupon,
    )
    return {"checkout_url": url}


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
    if tipo == "customer.subscription.updated":
        sub_id = data["id"]
        status = data["status"]
        barberia_id = int(data.get("metadata", {}).get("barberia_id", 0))
        plan = data.get("metadata", {}).get("plan", "pro")

        sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia_id).first()
        if sus:
            sus.stripe_subscription_id = sub_id
            sus.stripe_price_id = data["items"]["data"][0]["price"]["id"]
            sus.plan = plan
            if status == "active":
                sus.estado = "activa"
                barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()
                if barberia:
                    barberia.plan = plan
                    barberia.activa = True
            elif status in ("past_due", "unpaid", "canceled"):
                sus.estado = "suspendida"
                barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()
                if barberia:
                    barberia.activa = False
                    try:
                        enviar_aviso_suspension(barberia.email, barberia.nombre)
                    except Exception:
                        pass
            periodo_interval = data["items"]["data"][0]["price"]["recurring"]["interval"]
            sus.periodo = "anual" if periodo_interval == "year" else "mensual"
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
            db.commit()

    return {"ok": True}
