import asyncio
import os
import sys

from sqlalchemy import select

sys.path.insert(0, os.path.dirname(__file__))

from src.core.database import async_session, crear_tablas
from src.models.usuario import Usuario
from src.security.password import hashear_password
from src.security.schemas import Rol


ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@mediflow.cl")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
ADMIN_NOMBRE = os.getenv("ADMIN_NOMBRE", "Admin MediFlow")


async def crear_admin():
    if not ADMIN_PASSWORD:
        print("ERROR: variable ADMIN_PASSWORD no configurada")
        sys.exit(1)

    if len(ADMIN_PASSWORD) < 8:
        print("ERROR: ADMIN_PASSWORD debe tener al menos 8 caracteres")
        sys.exit(1)

    await crear_tablas()

    async with async_session() as session:
        existe = await session.execute(
            select(Usuario).where(Usuario.email == ADMIN_EMAIL)
        )
        if existe.scalar_one_or_none():
            print(f"Ya existe un usuario con email {ADMIN_EMAIL}")
            return

        admin = Usuario(
            nombre=ADMIN_NOMBRE,
            email=ADMIN_EMAIL,
            password_hash=hashear_password(ADMIN_PASSWORD),
            rol=Rol.ADMIN,
        )
        session.add(admin)
        await session.commit()
        print(f"Admin creado: {ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(crear_admin())
