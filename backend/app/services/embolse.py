from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.embolse import Embolse
from app.repositories.embolse import EmbolseRepository

CALENDARIO_EMBOLSE = {
    1: "AM", 2: "BL", 3: "AZ", 4: "RO", 5: "CA", 6: "NE", 7: "NA", 8: "VE",
    9: "VE", 10: "AM", 11: "BL", 12: "AZ", 13: "RO", 14: "CA", 15: "NE", 16: "NA",
    17: "NA", 18: "VE", 19: "AM", 20: "BL", 21: "AZ", 22: "RO", 23: "CA", 24: "NE",
    25: "NE", 26: "NA", 27: "VE", 28: "AM", 29: "BL", 30: "AZ", 31: "RO", 32: "CA",
    33: "CA", 34: "NE", 35: "NA", 36: "VE", 37: "AM", 38: "BL", 39: "AZ", 40: "RO",
    41: "RO", 42: "CA", 43: "NE", 44: "NA", 45: "VE", 46: "AM", 47: "BL", 48: "AZ",
    49: "AZ", 50: "RO", 51: "CA", 52: "NE",
}


def _color_por_semana(fecha: date) -> str:
    semana = fecha.isocalendar()[1]
    return CALENDARIO_EMBOLSE[semana]


class EmbolseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EmbolseRepository(db)

    def registrar_embolse(
        self,
        lote_id: int,
        fecha: date,
        cantidad: int,
        observacion: str | None = None,
    ) -> Embolse:
        color_cinta = _color_por_semana(fecha)
        return self.repo.crear(
            lote_id=lote_id,
            fecha=fecha,
            color_cinta=color_cinta,
            cantidad=cantidad,
            observacion=observacion,
        )

    def obtener_embolses_por_lote(self, lote_id: int) -> list[Embolse]:
        stmt = (
            select(Embolse)
            .where(Embolse.lote_id == lote_id)
            .order_by(Embolse.fecha.desc())
        )
        return list(self.db.scalars(stmt).all())

    def obtener_total_embolse_por_fecha(self, lote_id: int, fecha: date) -> int:
        stmt = (
            select(func.coalesce(func.sum(Embolse.cantidad), 0))
            .where(Embolse.lote_id == lote_id)
            .where(Embolse.fecha == fecha)
        )
        return self.db.scalar(stmt) or 0
