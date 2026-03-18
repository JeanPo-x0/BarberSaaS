from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import barberias, barberos, clientes, servicios, citas, auth

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(barberias.router)
app.include_router(barberos.router)
app.include_router(clientes.router)
app.include_router(servicios.router)
app.include_router(citas.router)

@app.get("/")
def root():
    return {"mensaje": "BarberSaaS activo, vibras lo mas importante!!🔥"}