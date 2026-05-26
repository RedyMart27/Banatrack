import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.lote import Lote


def cargar_lotes():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for i in range(30, 43):
            nombre = f"Lote {i}"
            existe = db.query(Lote).filter(Lote.nombre == nombre).first()
            if existe:
                print(f"{nombre} ya existe, saltando...")
                continue

            lote = Lote(nombre=nombre, supervisor="Supervisor")
            db.add(lote)
            print(f"{nombre} insertado.")

        db.commit()
        print("Todos los lotes fueron procesados.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    cargar_lotes()
