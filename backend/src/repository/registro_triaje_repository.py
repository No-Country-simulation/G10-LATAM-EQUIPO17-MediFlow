from typing import Optional
from sqlalchemy import select
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

    async def find_by_usuario(self, id_usuario: str) -> list[RegistroTriaje]:
        stmt = (
            select(RegistroTriaje)
            .where(RegistroTriaje.id_usuario == id_usuario)
            .order_by(RegistroTriaje.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def find_all(self) -> list[RegistroTriaje]:
        stmt = select(RegistroTriaje).order_by(RegistroTriaje.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def find_by_id(self, registro_id: str) -> Optional[RegistroTriaje]:
        return await self.db.get(RegistroTriaje, registro_id)
