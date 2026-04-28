from pydantic import BaseModel, field_validator
from typing import Optional
from urllib.parse import urlparse

MAPS_ALLOWED_HOSTS = {
    "maps.google.com", "www.maps.google.com",
    "google.com", "www.google.com",
    "goo.gl", "maps.app.goo.gl",
    "waze.com", "www.waze.com", "ul.waze.com",
    "maps.apple.com",
}

class BarberiaBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    logo: Optional[str] = None
    plan: Optional[str] = "basico"

class BarberiaCreate(BarberiaBase):
    pass

class MapsLinkUpdate(BaseModel):
    maps_link: Optional[str] = None

    @field_validator("maps_link")
    @classmethod
    def validar_maps_link(cls, v):
        if v is None or v == "":
            return None
        try:
            parsed = urlparse(v)
            if parsed.scheme not in ("http", "https"):
                raise ValueError("Solo se permiten URLs http/https")
            host = parsed.netloc.lower().split(":")[0]
            if host not in MAPS_ALLOWED_HOSTS:
                raise ValueError("Solo se permiten links de Google Maps, Waze o Apple Maps")
        except Exception as e:
            raise ValueError(str(e))
        return v

class HorarioUpdate(BaseModel):
    hora_apertura: str
    hora_cierre: str
    dias_abiertos: str

class BarberiaResponse(BarberiaBase):
    id: int
    activa: bool
    subdominio: Optional[str] = None
    maps_link: Optional[str] = None
    hora_apertura: Optional[str] = "08:00"
    hora_cierre: Optional[str] = "20:00"
    dias_abiertos: Optional[str] = "1,2,3,4,5,6"

    class Config:
        from_attributes = True


class BarberiaPublicaResponse(BaseModel):
    id: int
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    logo: Optional[str] = None
    activa: bool
    subdominio: Optional[str] = None
    maps_link: Optional[str] = None
    hora_apertura: Optional[str] = "08:00"
    hora_cierre: Optional[str] = "20:00"
    dias_abiertos: Optional[str] = "1,2,3,4,5,6"

    class Config:
        from_attributes = True