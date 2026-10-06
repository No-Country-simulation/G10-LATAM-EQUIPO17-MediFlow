from datetime import datetime
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.security.schemas import Rol
from src.models.usuario import Usuario


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    
    async def create_user(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        await self.db.commit()
        await self.db.refresh(usuario)
        return usuario
    
    async def find_by_email(self, email: str) -> Optional[Usuario]:
        stmt = select(Usuario).where(Usuario.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_id(self, user_id:str) -> Optional[Usuario]:
        return await self.db.get(Usuario, user_id)

    async def list_users(self) -> list[Usuario]:
        stmt = select(Usuario).order_by(Usuario.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_last_login(self, usuario: Usuario, fecha: datetime) -> Usuario:
        usuario.last_login = fecha
        await self.db.commit()
        return usuario

    async def update_rol(self, usuario: Usuario, rol: Rol) -> Usuario:
        usuario.rol = rol
        await self.db.commit()
        return usuario
        
