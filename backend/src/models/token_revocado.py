from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class TokenRevocado(Base):
    __tablename__ = "tokens_revocados"
    jti: Mapped[str] = mapped_column(String(36), primary_key=True)
    expira_en: Mapped[datetime] = mapped_column(DateTime)
