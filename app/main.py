from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

@app.get("/")
def root():
    return {"mensaje": "BarberSaaS activo, vibras lo mas importante!!🔥"}