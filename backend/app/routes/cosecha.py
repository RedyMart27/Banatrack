from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.cosecha import CosechaService

router = APIRouter(prefix="/cosecha", tags=["Cosecha"])


class CosechaCreate(BaseModel):
    lote_id: int
    fecha: date
    cantidad: int
    observacion: str | None = None


class CosechaResponse(BaseModel):
    id: int
    lote_id: int
    fecha: date
    color_cinta: str
    cantidad: int
    observacion: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DescuentoResponse(BaseModel):
    descuento: int | None


class RecobroResponse(BaseModel):
    recobro: float | None


@router.post("", response_model=CosechaResponse, status_code=201)
def registrar_cosecha(body: CosechaCreate, db: Session = Depends(get_db)):
    service = CosechaService(db)
    return service.registrar_cosecha(
        lote_id=body.lote_id,
        fecha=body.fecha,
        cantidad=body.cantidad,
        observacion=body.observacion,
    )


@router.get("/{lote_id}", response_model=list[CosechaResponse])
def obtener_cosechas(lote_id: int, db: Session = Depends(get_db)):
    service = CosechaService(db)
    return service.obtener_cosechas_por_lote(lote_id)


@router.get("/{lote_id}/descuento", response_model=DescuentoResponse)
def calcular_descuento(
    lote_id: int, fecha: date = Query(...), db: Session = Depends(get_db)
):
    service = CosechaService(db)
    descuento = service.calcular_descuento(lote_id, fecha)
    return {"descuento": descuento}


@router.get("/{lote_id}/recobro", response_model=RecobroResponse)
def calcular_recobro(
    lote_id: int, fecha: date = Query(...), db: Session = Depends(get_db)
):
    service = CosechaService(db)
    recobro = service.calcular_recobro(lote_id, fecha)
    return {"recobro": recobro}
