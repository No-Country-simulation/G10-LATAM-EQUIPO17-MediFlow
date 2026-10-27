import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class RegistroTriaje(Base):
    __tablename__ = "registros_triaje"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bucket: Mapped[str] = mapped_column(String(500))
    ruta_documento: Mapped[str | None] = mapped_column(String(500), default=None)
    ruta_triaje: Mapped[str] = mapped_column(String(500))
    id_usuario: Mapped[str] = mapped_column(String(36), ForeignKey("usuarios.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    id_medico_asignado: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("usuarios.id"), index=True, default=None,
    )
    comentario_medico: Mapped[str | None] = mapped_column(Text, default=None)
    fecha_asignacion: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    fecha_comentario: Mapped[datetime | None] = mapped_column(DateTime, default=None)
