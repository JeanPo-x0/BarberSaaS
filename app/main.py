from fastapi import FastAPI
from app.core.config import settings
from app.routers import barberias, barberos, clientes, servicios, citas

app = FastAPI(title=settings.APP_NAME)

app.include_router(barberias.router)
app.include_router(barberos.router)
app.include_router(clientes.router)
app.include_router(servicios.router)
app.include_router(citas.router)

@app.get("/")
def root():
    return {"mensaje": "BarberSaaS activo, vibras lo mas importante!!🔥"}