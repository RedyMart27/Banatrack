from sqlalchemy.orm import Session

from app.models.lote import Lote
from app.repositories.base import BaseRepository


class LoteRepository(BaseRepository[Lote]):
    def __init__(self, db: Session):
        super().__init__(db, Lote)
