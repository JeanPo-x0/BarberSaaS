from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.email import enviar_email
from app.core.config import settings

router = APIRouter(prefix="/soporte", tags=["Soporte"])


class ContactoRequest(BaseModel):
    tipo: str  # "reembolso" | "reporte"
    correo: str
    campos: dict


@router.post("/contacto")
def enviar_contacto(datos: ContactoRequest):
    asuntos = {
        "reembolso": "Solicitud de Reembolso — BarberSaaS",
        "reporte":   "Reporte de Problema — BarberSaaS",
    }
    asunto = asuntos.get(datos.tipo, f"Contacto — {datos.tipo}")

    filas = "".join(
        f"<tr><td style='padding:6px 12px;color:#aaa;font-size:13px;'>{k}</td>"
        f"<td style='padding:6px 12px;color:#fff;font-size:13px;'>{v}</td></tr>"
        for k, v in datos.campos.items()
    )

    cuerpo = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#111;color:#fff;padding:32px;border-radius:12px;">
      <h2 style="color:#C9A84C;margin:0 0 8px;">{asunto}</h2>
      <p style="color:#aaa;font-size:13px;margin:0 0 20px;">Recibido desde el panel de Soporte de BarberSaaS.</p>
      <table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
        {filas}
      </table>
      <p style="color:#555;font-size:11px;margin-top:24px;">BarberSaaS — saascompany.cr@gmail.com</p>
    </div>
    """

    try:
        enviar_email(settings.SUPERADMIN_EMAIL, asunto, cuerpo)
        confirmacion = f"""
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#111;color:#fff;padding:32px;border-radius:12px;">
          <h2 style="color:#C9A84C;margin:0 0 8px;">Recibimos tu solicitud</h2>
          <p style="color:#ccc;">Hemos recibido tu mensaje y te responderemos en un plazo de <strong>1-2 días hábiles</strong>.</p>
          <p style="color:#aaa;font-size:13px;">Si tu solicitud es urgente escribinos directamente a <a href="mailto:{settings.SUPERADMIN_EMAIL}" style="color:#C9A84C;">{settings.SUPERADMIN_EMAIL}</a>.</p>
          <p style="color:#555;font-size:11px;margin-top:24px;">BarberSaaS</p>
        </div>
        """
        try:
            enviar_email(datos.correo, "Recibimos tu solicitud — BarberSaaS", confirmacion)
        except Exception:
            pass
    except Exception as e:
        print(f"[soporte/contacto] Error enviando email: {e}")
        raise HTTPException(status_code=500, detail=f"Error al enviar: {str(e)}")

    return {"ok": True}
