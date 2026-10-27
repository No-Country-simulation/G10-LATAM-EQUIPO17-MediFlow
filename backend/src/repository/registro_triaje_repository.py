from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.registro_triaje import RegistroTriaje


class RegistroTriajeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, registro: RegistroTriaje) -> RegistroTriaje:
        self.db.add(registro)
        await self.db.commit()
        await self.db.refresh(registro)
        return registro

    async def find_by_usuario(self, id_usuario: str, offset: int = 0, limit: int = 50) -> tuple[list[RegistroTriaje], int]:
        total_result = await self.db.execute(
            select(func.count()).select_from(RegistroTriaje).where(RegistroTriaje.id_usuario == id_usuario)
        )
        total = total_result.scalar()

        stmt = (
            select(RegistroTriaje)
            .where(RegistroTriaje.id_usuario == id_usuario)
            .order_by(RegistroTriaje.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all(), total

    async def find_all(self, offset: int = 0, limit: int = 50) -> tuple[list[RegistroTriaje], int]:
        total_result = await self.db.execute(select(func.count()).select_from(RegistroTriaje))
        total = total_result.scalar()

        stmt = select(RegistroTriaje).order_by(RegistroTriaje.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total

    async def find_by_id(self, registro_id: str) -> Optional[RegistroTriaje]:
        return await self.db.get(RegistroTriaje, registro_id)
