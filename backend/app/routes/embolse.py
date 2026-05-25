from datetime import date, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.embolse import EmbolseService

router = APIRouter(prefix="/embolse", tags=["Embolse"])


class EmbolseCreate(BaseModel):
    lote_id: int
    fecha: date
    cantidad: int
    observacion: str | None = None


class EmbolseResponse(BaseModel):
    id: int
    lote_id: int
    fecha: date
    color_cinta: str
    cantidad: int
    observacion: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=EmbolseResponse, status_code=201)
def registrar_embolse(body: EmbolseCreate, db: Session = Depends(get_db)):
    service = EmbolseService(db)
    return service.registrar_embolse(
        lote_id=body.lote_id,
        fecha=body.fecha,
        cantidad=body.cantidad,
        observacion=body.observacion,
    )


@router.get("/{lote_id}", response_model=list[EmbolseResponse])
def obtener_embolses(lote_id: int, db: Session = Depends(get_db)):
    service = EmbolseService(db)
    return service.obtener_embolses_por_lote(lote_id)
