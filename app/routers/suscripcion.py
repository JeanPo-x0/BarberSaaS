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
from app.services.email import enviar_recibo_pago, enviar_aviso_suspension, enviar_verificacion_email
from app.models.email_verification import EmailVerificationToken
from app.core.config import settings
import secrets, hashlib
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
    elif sus.estado in ("trial", "pendiente_pago"):
        es_nuevo = True  # pendiente_pago = nunca pagó, trial = pagó pero en período de prueba

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


@router.post("/forzar-sync")
def forzar_sincronizacion(
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    """Lee las suscripciones activas del cliente en Stripe y actualiza la BD."""
    try:
        import stripe as stripe_lib

        sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == usuario.barberia_id).first()
        barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()

        customer_id = sus.stripe_customer_id if sus else None

        # Si no hay customer_id guardado (sync inicial falló), buscar en Stripe por email
        if not customer_id and barberia and barberia.email:
            customers = stripe_lib.Customer.list(email=barberia.email, limit=1)
            if customers.data:
                customer_id = customers.data[0].id
                if sus:
                    sus.stripe_customer_id = customer_id
                    db.flush()

        if not customer_id:
            raise HTTPException(status_code=400, detail="No hay customer de Stripe registrado")

        # Listar suscripciones del customer y tomar la más reciente activa/trialing
        result = stripe_lib.Subscription.list(customer=customer_id, limit=10)
        data = result.data  # atributo directo, funciona en todas las versiones del SDK
        if not data:
            raise HTTPException(status_code=400, detail="No hay suscripciones en Stripe para este cliente")
        sub_raw = next((s for s in data if s.status in ("active", "trialing")), None)
        if not sub_raw:
            raise HTTPException(status_code=400, detail="No hay suscripción activa en Stripe")
        sub = stripe_lib.Subscription.retrieve(sub_raw.id, expand=["items.data.price"])

        meta = getattr(sub, "metadata", {}) or {}
        plan = meta.get("plan", "pro") if hasattr(meta, "get") else getattr(meta, "plan", "pro")
        if plan not in ("pro", "premium"):
            plan = "pro"

        status = getattr(sub, "status", "trialing")
        sus.stripe_subscription_id = sub.id

        try:
            items = list(sub.items.data)
            price = items[0].price if items else None
            interval = price.recurring.interval if price and price.recurring else "month"
            if price:
                sus.stripe_price_id = price.id
            sus.periodo = "anual" if interval == "year" else "mensual"
        except Exception:
            pass

        sus.plan = plan
        barberia = db.query(Barberia).filter(Barberia.id == usuario.barberia_id).first()

        if status == "trialing":
            sus.estado = "trial"
            try:
                if sub.trial_end:
                    sus.fecha_trial_fin = datetime.utcfromtimestamp(sub.trial_end)
            except Exception:
                pass
            if barberia:
                barberia.plan = plan
                barberia.activa = True
        elif status == "active":
            sus.estado = "activa"
            if barberia:
                barberia.plan = plan
                barberia.activa = True

        try:
            if sub.current_period_end:
                sus.fecha_renovacion = datetime.utcfromtimestamp(sub.current_period_end)
        except Exception:
            pass

        db.commit()
        return {"ok": True, "plan": plan, "estado": sus.estado, "periodo": sus.periodo}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error Stripe: {str(e)}")


@router.post("/sincronizar")
def sincronizar_desde_checkout(
    datos: dict,
    db: Session = Depends(get_db),
    # Sin auth — el session_id de Stripe es suficiente validación
):
    """Sincroniza la suscripción local con Stripe usando el session_id del checkout."""
    session_id = datos.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requerido")

    try:
        session = stripe_lib.checkout.Session.retrieve(
            session_id, expand=["subscription", "subscription.items.data.price"]
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Session invalida")

    sub = getattr(session, "subscription", None)
    if not sub or isinstance(sub, str):
        raise HTTPException(status_code=400, detail="No hay suscripcion en este session")

    # Obtener barberia_id desde el metadata de la sesión de Stripe
    # El SDK nuevo retorna StripeObject (no dict) — usar getattr en lugar de .get()
    ses_meta = getattr(session, "metadata", None)
    barberia_id_str = str(getattr(ses_meta, "barberia_id", "") or "")
    if not barberia_id_str:
        raise HTTPException(status_code=400, detail="Session sin barberia_id en metadata")
    barberia_id = int(barberia_id_str)

    sus = db.query(Suscripcion).filter(Suscripcion.barberia_id == barberia_id).first()
    if not sus:
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada")

    sub_meta = getattr(sub, "metadata", None)
    ses_meta = getattr(session, "metadata", None)
    plan = getattr(sub_meta, "plan", None) or getattr(ses_meta, "plan", None) or "pro"
    if plan not in ("pro", "premium"):
        plan = "pro"

    status = getattr(sub, "status", None)
    try:
        items = list(sub.items.data)
        price = items[0].price if items else None
        interval = price.recurring.interval if price and price.recurring else "month"
        price_id = price.id if price else None
    except Exception:
        items, interval, price_id = [], "month", None

    sus.stripe_subscription_id = sub.id
    customer_id = getattr(session, "customer", None)
    if customer_id and isinstance(customer_id, str):
        sus.stripe_customer_id = customer_id
    if price_id:
        sus.stripe_price_id = price_id
    sus.plan = plan
    sus.periodo = "anual" if interval == "year" else "mensual"

    barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()

    if status == "trialing":
        sus.estado = "trial"
        trial_end = getattr(sub, "trial_end", None)
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

    period_end = getattr(sub, "current_period_end", None)
    if period_end:
        sus.fecha_renovacion = datetime.utcfromtimestamp(period_end)

    db.commit()

    estado_final = sus.estado
    print(f"[sincronizar] barberia_id={barberia_id} stripe_status={status} estado_db={estado_final}", flush=True)

    # Enviar email de verificación ahora que el pago está confirmado
    if estado_final in ("activa", "trial"):
        try:
            usuario_db = db.query(Usuario).filter(Usuario.barberia_id == barberia_id).first()
            print(f"[sincronizar] usuario_db={usuario_db and usuario_db.email} email_verificado={usuario_db and usuario_db.email_verificado}", flush=True)
            if usuario_db and not usuario_db.email_verificado:
                db.query(EmailVerificationToken).filter(
                    EmailVerificationToken.email == usuario_db.email,
                    EmailVerificationToken.usado == False
                ).update({"usado": True})
                token_plano = secrets.token_urlsafe(32)
                token_hash = hashlib.sha256(token_plano.encode()).hexdigest()
                db.add(EmailVerificationToken(
                    email=usuario_db.email,
                    token_hash=token_hash,
                    expires_at=datetime.utcnow() + timedelta(hours=24),
                ))
                db.commit()
                print(f"[sincronizar] enviando email a {usuario_db.email}", flush=True)
                enviar_verificacion_email(usuario_db.email, token_plano, settings.FRONTEND_URL)
                print(f"[sincronizar] email enviado OK", flush=True)
        except Exception as e:
            print(f"[sincronizar] ERROR email: {e}", flush=True)

    return {"ok": True, "plan": plan, "estado": estado_final, "periodo": sus.periodo}


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

    # Helper: accede a campos de StripeObject (no tiene .get() en SDK nuevo)
    def _g(key, default=None):
        try:
            v = data[key]
            return v if v is not None else default
        except (KeyError, TypeError, AttributeError):
            return default

    def _meta(key, default=None):
        meta = _g("metadata")
        if not meta:
            return default
        try:
            v = meta[key]
            return v if v is not None else default
        except (KeyError, TypeError, AttributeError):
            return getattr(meta, key, default) or default

    # Suscripción activada (trial o pago exitoso)
    if tipo in ("customer.subscription.created", "customer.subscription.updated"):
        sub_id = data["id"]
        status = data["status"]
        barberia_id = int(_meta("barberia_id", 0) or 0)
        if barberia_id <= 0:
            return {"ok": False, "razon": "barberia_id invalido"}
        plan = _meta("plan") or "pro"
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
            cancel_at_end = _g("cancel_at_period_end", False)

            barberia = db.query(Barberia).filter(Barberia.id == barberia_id).first()

            if status == "trialing":
                sus.estado = "trial"
                trial_end_ts = _g("trial_end")
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

            ts = _g("current_period_end")
            if ts:
                sus.fecha_renovacion = datetime.utcfromtimestamp(ts)
            db.commit()

    # Pago exitoso → recibo por email
    elif tipo == "invoice.payment_succeeded":
        customer_id = _g("customer")
        monto = (_g("amount_paid", 0) or 0) / 100
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
        customer_id = _g("customer")
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
