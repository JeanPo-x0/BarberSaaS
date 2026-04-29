from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.email import enviar_email, _base, _titulo, _parrafo, _separador, _boton
from app.core.config import settings
from html import escape

router = APIRouter(prefix="/soporte", tags=["Soporte"])


class ContactoRequest(BaseModel):
    tipo: str  # "reembolso" | "reporte"
    correo: str
    campos: dict


@router.post("/contacto")
def enviar_contacto(datos: ContactoRequest):
    TIPOS = {
        "reembolso": ("Solicitud de Reembolso", "#C9A84C"),
        "reporte":   ("Reporte de Problema",    "#E63946"),
    }
    titulo_tipo, color_tipo = TIPOS.get(datos.tipo, (f"Contacto — {datos.tipo}", "#C9A84C"))
    asunto_admin = f"{titulo_tipo} — BarberSaaS"

    filas_html = "".join(
        f"""<tr>
          <td style="padding:11px 16px;font-size:13px;color:#555555;border-bottom:1px solid #1A1A1A;white-space:nowrap;">{escape(str(k))}</td>
          <td style="padding:11px 16px;font-size:13px;color:#F5F5F5;text-align:right;font-weight:600;border-bottom:1px solid #1A1A1A;word-break:break-word;">{escape(str(v))}</td>
        </tr>"""
        for k, v in datos.campos.items()
    )

    # ── Email al admin ──────────────────────────────────────────────────
    contenido_admin = f"""
{_titulo(titulo_tipo, color_tipo)}
{_parrafo("Nueva solicitud recibida desde el panel de soporte de BarberSaaS.")}
{_separador()}
<table cellpadding="0" cellspacing="0" role="presentation" width="100%"
       style="border:1px solid #1E1E1E;border-radius:8px;overflow:hidden;">
  {filas_html}
</table>
{_boton("Ver panel de admin", f"{settings.FRONTEND_URL}/admin", "#C9A84C", "#0A0A0A")}"""

    try:
        enviar_email(settings.SUPERADMIN_EMAIL, asunto_admin, _base(contenido_admin))
    except Exception as e:
        print(f"[soporte/contacto] Error enviando email al admin: {e}")
        raise HTTPException(status_code=500, detail=f"Error al enviar: {str(e)}")

    # ── Email de confirmación al usuario — incluye resumen de lo enviado ─
    contenido_conf = f"""
{_titulo("Recibimos tu solicitud")}
{_parrafo("Hemos recibido tu solicitud correctamente y te responderemos en un plazo de <strong style='color:#F5F5F5;'>5 dias habiles</strong>. A continuacion encontras un resumen de lo que nos enviaste.")}
{_separador()}
<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#555555;text-transform:uppercase;">{titulo_tipo}</p>
<table cellpadding="0" cellspacing="0" role="presentation" width="100%"
       style="border:1px solid #1E1E1E;border-radius:8px;overflow:hidden;">
  {filas_html}
</table>
{_separador()}
<div style="background:#161616;border:1px solid #1E1E1E;border-radius:8px;padding:16px 18px;">
  <p style="margin:0;font-size:13px;color:#888888;line-height:1.7;">
    Si tu solicitud es urgente, escribinos directamente a
    <a href="mailto:{settings.SUPERADMIN_EMAIL}" style="color:#C9A84C;text-decoration:none;">{settings.SUPERADMIN_EMAIL}</a>.
  </p>
</div>"""

    try:
        enviar_email(datos.correo, "Recibimos tu solicitud — BarberSaaS", _base(contenido_conf))
    except Exception as e:
        print(f"[soporte/contacto] Error enviando confirmacion al usuario: {e}")

    return {"ok": True}
