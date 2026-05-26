from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, db: Session, model: type[ModelType]):
        self.db = db
        self.model = model

    def crear(self, **kwargs) -> ModelType:
        obj = self.model(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def obtener_datos(self) -> list[ModelType]:
        stmt = select(self.model)
        return list(self.db.scalars(stmt).all())

    def obtener_por_id(self, id: int) -> ModelType | None:
        stmt = select(self.model).where(self.model.id == id)
        return self.db.scalar(stmt)

    def actualizar(self, id: int, **kwargs) -> ModelType | None:
        obj = self.obtener_por_id(id)
        if obj is None:
            return None
        for key, value in kwargs.items():
            setattr(obj, key, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def eliminar(self, id: int) -> bool:
        obj = self.obtener_por_id(id)
        if obj is None:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
