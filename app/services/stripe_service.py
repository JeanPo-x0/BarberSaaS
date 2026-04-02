import stripe
from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY

PRECIOS = {
    "pro": {
        "mensual": settings.STRIPE_PRICE_PRO_MENSUAL,
        "anual": settings.STRIPE_PRICE_PRO_ANUAL,
    },
    "premium": {
        "mensual": settings.STRIPE_PRICE_PREMIUM_MENSUAL,
        "anual": settings.STRIPE_PRICE_PREMIUM_ANUAL,
    },
}


def crear_cliente(email: str, nombre: str) -> str:
    cliente = stripe.Customer.create(email=email, name=nombre)
    return cliente.id


def crear_checkout_session(
    customer_id: str,
    plan: str,
    periodo: str,
    barberia_id: int,
    coupon: str = None,
) -> str:
    price_id = PRECIOS[plan][periodo]
    params = {
        "customer": customer_id,
        "payment_method_types": ["card"],
        "line_items": [{"price": price_id, "quantity": 1}],
        "mode": "subscription",
        "subscription_data": {
            "trial_period_days": 14,
            "metadata": {"barberia_id": str(barberia_id), "plan": plan},
        },
        "success_url": f"{settings.FRONTEND_URL}/suscripcion/exito?session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": f"{settings.FRONTEND_URL}/planes",
        "metadata": {"barberia_id": str(barberia_id), "plan": plan, "periodo": periodo},
    }
    if coupon:
        params["discounts"] = [{"coupon": coupon}]
    session = stripe.checkout.Session.create(**params)
    return session.url


def crear_portal_session(customer_id: str, barberia_id: int) -> str:
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/panel",
    )
    return session.url


def cancelar_suscripcion(stripe_subscription_id: str) -> None:
    stripe.Subscription.cancel(stripe_subscription_id)


def construir_evento_webhook(payload: bytes, sig_header: str):
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
