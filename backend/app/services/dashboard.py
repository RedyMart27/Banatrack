from datetime import date
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.embolse import Embolse
from app.models.lote import Lote
from app.services.cosecha import CosechaService
from app.services.embolse import _color_por_semana

class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def obtener_resumen_hoy(self, fecha: date) -> dict:
        semana = fecha.isocalendar()[1]
        color_embolse = _color_por_semana(fecha)
        colores_cosecha = CosechaService.obtener_colores_disponibles(fecha)

        detalle = []
        for color in colores_cosecha:
            stmt = (
                select(
                    Embolse.lote_id,
                    Lote.nombre.label("lote_nombre"),
                    func.coalesce(func.sum(Embolse.cantidad), 0).label("total_embolse"),
                )
                .join(Lote, Lote.id == Embolse.lote_id)
                .where(Embolse.color_cinta == color)
                .group_by(Embolse.lote_id, Lote.nombre)
                .order_by(Lote.nombre)
            )
            rows = self.db.execute(stmt).all()
            detalle.append({
                "color": color,
                "lotes": [
                    {
                        "lote_id": row.lote_id,
                        "lote_nombre": row.lote_nombre,
                        "total_embolse": row.total_embolse,
                    }
                    for row in rows
                ],
            })

        return {
            "fecha_consultada": fecha,
            "numero_semana": semana,
            "color_embolse_hoy": color_embolse,
            "colores_cosecha_hoy": colores_cosecha,
            "detalle_cosecha": detalle,
        }
