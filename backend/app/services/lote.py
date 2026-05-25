from sqlalchemy.orm import Session

from app.models.lote import Lote
from app.repositories.lote import LoteRepository


class LoteService:
    def __init__(self, db: Session):
        self.repo = LoteRepository(db)

    def crear_lote(self, nombre: str, supervisor: str) -> Lote:
        return self.repo.crear(nombre=nombre, supervisor=supervisor)

    def obtener_lotes(self) -> list[Lote]:
        return self.repo.obtener_datos()

    def obtener_lote(self, lote_id: int) -> Lote | None:
        return self.repo.obtener_por_id(lote_id)
