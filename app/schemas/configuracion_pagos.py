from pydantic import BaseModel
from typing import Optional

class ConfiguracionPagosBase(BaseModel):
    sinpe_habilitado:         bool = True
    sinpe_numero:             Optional[str] = None
    sinpe_nombre:             Optional[str] = None
    efectivo_habilitado:      bool = True
    deposito_requerido:       bool = False
    deposito_porcentaje:      int  = 50
    cancelacion_porcentaje:   int  = 0
    cancelacion_horas_minimo: int  = 24

class ConfiguracionPagosUpdate(ConfiguracionPagosBase):
    pass

class ConfiguracionPagosResponse(ConfiguracionPagosBase):
    id:          int
    barberia_id: int
    class Config:
        from_attributes = True

class ConfiguracionPagosPublica(BaseModel):
    sinpe_habilitado:    bool
    sinpe_numero:        Optional[str] = None
    sinpe_nombre:        Optional[str] = None
    efectivo_habilitado: bool
    deposito_requerido:  bool
    deposito_porcentaje: int
    class Config:
        from_attributes = True
