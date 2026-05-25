from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

COLORES_CINTA = ["BL", "AZ", "RO", "CA", "NE", "NA", "VE", "AM"]


class Lote(Base):
    __tablename__ = "lotes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    supervisor: Mapped[str] = mapped_column(String(100), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    embolses: Mapped[list["Embolse"]] = relationship(
        back_populates="lote", cascade="all, delete-orphan"
    )
    cosechas: Mapped[list["Cosecha"]] = relationship(
        back_populates="lote", cascade="all, delete-orphan"
    )
