from sqlalchemy.orm import Session

from app.models.embolse import Embolse
from app.repositories.base import BaseRepository


class EmbolseRepository(BaseRepository[Embolse]):
    def __init__(self, db: Session):
        super().__init__(db, Embolse)
