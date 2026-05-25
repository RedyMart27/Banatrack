from sqlalchemy.orm import Session

from app.models.cosecha import Cosecha
from app.repositories.base import BaseRepository


class CosechaRepository(BaseRepository[Cosecha]):
    def __init__(self, db: Session):
        super().__init__(db, Cosecha)
