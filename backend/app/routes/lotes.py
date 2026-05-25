from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.lote import LoteService

router = APIRouter(prefix="/lotes", tags=["Lotes"])


class LoteCreate(BaseModel):
    nombre: str
    supervisor: str


class LoteResponse(BaseModel):
    id: int
    nombre: str
    supervisor: str
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=LoteResponse, status_code=201)
def crear_lote(body: LoteCreate, db: Session = Depends(get_db)):
    service = LoteService(db)
    return service.crear_lote(nombre=body.nombre, supervisor=body.supervisor)


@router.get("", response_model=list[LoteResponse])
def obtener_lotes(db: Session = Depends(get_db)):
    service = LoteService(db)
    return service.obtener_lotes()


@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(lote_id: int, db: Session = Depends(get_db)):
    service = LoteService(db)
    lote = service.obtener_lote(lote_id)
    if lote is None:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote
