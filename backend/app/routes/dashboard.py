from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/hoy")
def resumen_hoy(
    fecha: date = Query(default=None), db: Session = Depends(get_db)
):
    if fecha is None:
        fecha = date.today()
    service = DashboardService(db)
    return service.obtener_resumen_hoy(fecha)
