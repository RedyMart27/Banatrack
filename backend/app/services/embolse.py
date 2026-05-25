from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.embolse import Embolse
from app.models.lote import COLORES_CINTA
from app.repositories.embolse import EmbolseRepository


def _color_por_semana(fecha: date) -> str:
    semana = fecha.isocalendar()[1]
    return COLORES_CINTA[(semana - 1) % len(COLORES_CINTA)]


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
