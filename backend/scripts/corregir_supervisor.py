import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine, Base
from app.models.lote import Lote


def corregir_supervisor():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        lotes = db.query(Lote).all()
        if not lotes:
            print("No hay lotes para actualizar.")
            return

        for lote in lotes:
            lote.supervisor = "Azel Martinez"
            print(f"{lote.nombre} actualizado.")

        db.commit()
        print(f"Se actualizaron {len(lotes)} lotes.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    corregir_supervisor()
