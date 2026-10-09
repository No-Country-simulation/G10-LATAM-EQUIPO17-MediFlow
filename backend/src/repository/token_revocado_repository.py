from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.token_revocado import TokenRevocado

class TokenRevocadoRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, token_revocado: TokenRevocado) -> TokenRevocado:
        self.db.add(token_revocado)
        await self.db.commit()
        await self.db.refresh(token_revocado)
        return token_revocado

    async def find_by_jti(self, jti: str) -> Optional[TokenRevocado]:
        return await self.db.get(TokenRevocado, jti)