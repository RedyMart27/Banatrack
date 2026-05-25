from datetime import datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

COLORES_CINTA = ["BL", "AZ", "RO", "CA", "NE", "NA", "VE", "AM"]


class Cosecha(Base):
    __tablename__ = "cosechas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lote_id: Mapped[int] = mapped_column(ForeignKey("lotes.id"), nullable=False)
    fecha: Mapped[datetime] = mapped_column(Date, nullable=False)
    color_cinta: Mapped[str] = mapped_column(String(2), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    observacion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    lote: Mapped["Lote"] = relationship(back_populates="cosechas")
