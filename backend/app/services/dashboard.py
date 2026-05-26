from datetime import date, timedelta
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.cosecha import Cosecha
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

    def obtener_inventario_proyectado(self, fecha: date) -> list[dict]:
        days_ahead = 0 - fecha.weekday()
        monday = fecha + timedelta(days=days_ahead)

        semanas = []
        for i in range(4):
            week_monday = monday + timedelta(weeks=i)
            semana_num = week_monday.isocalendar()[1]
            colores = CosechaService.obtener_colores_disponibles(week_monday)

            detalle_colores = []
            for color in colores:
                stmt = (
                    select(func.coalesce(func.sum(Embolse.cantidad), 0))
                    .where(Embolse.color_cinta == color)
                )
                total = self.db.scalar(stmt) or 0
                detalle_colores.append({
                    "color": color,
                    "total_embolse": total,
                })

            semanas.append({
                "semana": semana_num,
                "colores": detalle_colores,
            })

        return semanas

    def obtener_alertas(self, fecha: date) -> list[dict]:
        lotes = self.db.execute(
            select(Lote.id, Lote.nombre).where(Lote.activo == True)
        ).all()

        alertas = []
        for lote in lotes:
            total_embolse = self.db.scalar(
                select(func.coalesce(func.sum(Embolse.cantidad), 0))
                .where(Embolse.lote_id == lote.id, Embolse.fecha == fecha)
            ) or 0

            total_cosecha = self.db.scalar(
                select(func.coalesce(func.sum(Cosecha.cantidad), 0))
                .where(Cosecha.lote_id == lote.id, Cosecha.fecha == fecha)
            ) or 0

            if total_embolse == 0:
                continue

            recobro = total_cosecha / total_embolse

            if recobro < 0.85:
                nivel = "crítico" if recobro < 0.75 else "advertencia"
                alertas.append({
                    "lote_id": lote.id,
                    "lote_nombre": lote.nombre,
                    "recobro": round(recobro * 100, 2),
                    "nivel_alerta": nivel,
                })

        return alertas
