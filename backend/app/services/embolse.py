from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.embolse import Embolse
from app.repositories.embolse import EmbolseRepository

CALENDARIO_BANASAN = {
    1: "VE", 2: "AM", 3: "BL", 4: "AZ", 5: "RO",
    6: "CA", 7: "NE", 8: "NA", 9: "VE", 10: "AM",
    11: "BL", 12: "AZ", 13: "RO", 14: "CA", 15: "NE",
    16: "NA", 17: "VE", 18: "AM", 19: "BL", 20: "AZ",
    21: "RO", 22: "CA", 23: "NE", 24: "NA", 25: "VE",
    26: "AM", 27: "BL", 28: "AZ", 29: "RO", 30: "CA",
    31: "CA", 32: "NA", 33: "VE", 34: "AM", 35: "BL",
    36: "AZ", 37: "RO", 38: "CA", 39: "NE", 40: "NA",
    41: "VE", 42: "AM", 43: "BL", 44: "AZ", 45: "RO",
    46: "CA", 47: "NE", 48: "NA", 49: "VE", 50: "AM",
    51: "BL", 52: "AZ",
}


def _color_por_semana(fecha: date) -> str:
    semana = fecha.isocalendar()[1]
    return CALENDARIO_BANASAN[semana]


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
