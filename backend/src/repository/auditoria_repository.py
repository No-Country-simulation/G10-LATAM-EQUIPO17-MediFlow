from datetime import datetime
from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.registro_auditoria import RegistroAuditoria


class AuditoriaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, registro: RegistroAuditoria) -> RegistroAuditoria:
        self.db.add(registro)
        await self.db.commit()
        return registro

    async def find_all(
        self,
        usuario_id: Optional[str] = None,
        metodo: Optional[str] = None,
        status_min: Optional[int] = None,
        status_max: Optional[int] = None,
        desde: Optional[datetime] = None,
        hasta: Optional[datetime] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[RegistroAuditoria], int]:
        filtros = []
        if usuario_id:
            filtros.append(RegistroAuditoria.usuario_id == usuario_id)
        if metodo:
            filtros.append(RegistroAuditoria.metodo == metodo.upper())
        if status_min is not None:
            filtros.append(RegistroAuditoria.status_code >= status_min)
        if status_max is not None:
            filtros.append(RegistroAuditoria.status_code <= status_max)
        if desde:
            filtros.append(RegistroAuditoria.created_at >= desde)
        if hasta:
            filtros.append(RegistroAuditoria.created_at <= hasta)

        base = select(RegistroAuditoria)
        count_base = select(func.count()).select_from(RegistroAuditoria)
        for f in filtros:
            base = base.where(f)
            count_base = count_base.where(f)

        total_result = await self.db.execute(count_base)
        total = total_result.scalar()

        stmt = base.order_by(RegistroAuditoria.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total
