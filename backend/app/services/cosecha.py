from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.cosecha import Cosecha
from app.repositories.cosecha import CosechaRepository
from app.services.embolse import _color_por_semana


class CosechaService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CosechaRepository(db)

    def registrar_cosecha(
        self,
        lote_id: int,
        fecha: date,
        cantidad: int,
        observacion: str | None = None,
    ) -> Cosecha:
        color_cinta = _color_por_semana(fecha)
        return self.repo.crear(
            lote_id=lote_id,
            fecha=fecha,
            color_cinta=color_cinta,
            cantidad=cantidad,
            observacion=observacion,
        )

    def _total_embolse(self, lote_id: int, fecha: date) -> int:
        from app.models.embolse import Embolse

        stmt = (
            select(func.coalesce(func.sum(Embolse.cantidad), 0))
            .where(Embolse.lote_id == lote_id)
            .where(Embolse.fecha == fecha)
        )
        return self.db.scalar(stmt) or 0

    def obtener_cosechas_por_lote(self, lote_id: int) -> list[Cosecha]:
        stmt = (
            select(Cosecha)
            .where(Cosecha.lote_id == lote_id)
            .order_by(Cosecha.fecha.desc())
        )
        return list(self.db.scalars(stmt).all())

    def calcular_descuento(self, lote_id: int, fecha: date) -> int | None:
        embolse_total = self._total_embolse(lote_id, fecha)
        if embolse_total == 0:
            return None
        stmt = (
            select(func.coalesce(func.sum(Cosecha.cantidad), 0))
            .where(Cosecha.lote_id == lote_id)
            .where(Cosecha.fecha == fecha)
        )
        cosecha_dia = self.db.scalar(stmt) or 0
        return embolse_total - cosecha_dia

    def calcular_recobro(self, lote_id: int, fecha: date) -> float | None:
        embolse_total = self._total_embolse(lote_id, fecha)
        if embolse_total == 0:
            return None
        stmt = (
            select(func.coalesce(func.sum(Cosecha.cantidad), 0))
            .where(Cosecha.lote_id == lote_id)
            .where(Cosecha.fecha == fecha)
        )
        cosecha_dia = self.db.scalar(stmt) or 0
        descuento = embolse_total - cosecha_dia
        return round(descuento / embolse_total, 2)
