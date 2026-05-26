from datetime import date

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.cosecha import Cosecha
from app.repositories.cosecha import CosechaRepository
from app.services.embolse import CALENDARIO_EMBOLSE


class CosechaService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CosechaRepository(db)

    @staticmethod
    def obtener_colores_disponibles(fecha: date) -> list[str]:
        semana = fecha.isocalendar()[1]
        return [
            CALENDARIO_EMBOLSE[(semana - offset - 1) % 52 + 1]
            for offset in (10, 11, 12)
        ]

    def registrar_cosecha(
        self,
        lote_id: int,
        fecha: date,
        cantidad: int,
        color_cinta: str,
        observacion: str | None = None,
    ) -> Cosecha:
        colores = self.obtener_colores_disponibles(fecha)
        if color_cinta not in colores:
            raise ValueError(
                f"Color '{color_cinta}' no válido. Colores disponibles: {colores}"
            )
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

    def actualizar_cosecha(
        self, cosecha_id: int, cantidad: int, observacion: str | None = None
    ) -> Cosecha | None:
        return self.repo.actualizar(
            cosecha_id, cantidad=cantidad, observacion=observacion
        )

    def eliminar_cosecha(self, cosecha_id: int) -> bool:
        return self.repo.eliminar(cosecha_id)

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
