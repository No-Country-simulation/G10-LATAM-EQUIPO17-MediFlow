import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class RegistroAuditoria(Base):
    __tablename__ = "registros_auditoria"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id: Mapped[str] = mapped_column(String(8), index=True)
    metodo: Mapped[str] = mapped_column(String(10))
    path: Mapped[str] = mapped_column(String(500))
    status_code: Mapped[int] = mapped_column(Integer)
    duracion_ms: Mapped[float] = mapped_column()
    ip: Mapped[str] = mapped_column(String(45))
    usuario_id: Mapped[str | None] = mapped_column(String(36), index=True, default=None)
    rol: Mapped[str | None] = mapped_column(String(20), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
