from app.database import SessionLocal
from app.models.barberia import Barberia

db = SessionLocal()
b = db.query(Barberia).filter(Barberia.id == 4).first()
b.twilio_numero = "+14155238886"
db.commit()
print(f"Guardado: {b.nombre} -> {b.twilio_numero}")
db.close()
