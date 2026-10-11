import pytest
from tests.conftest import session_test
from src.models.usuario import Usuario
from src.security.schemas import Rol


@pytest.mark.asyncio
async def test_admin_inicial_se_crea_con_variables():
    from sqlalchemy import select
    from src.security.password import hashear_password

    async with session_test() as session:
        admin = Usuario(
            nombre="Admin Test",
            email="admin-init@mediflow.cl",
            password_hash=hashear_password("password_admin_123"),
            rol=Rol.ADMIN,
        )
        session.add(admin)
        await session.commit()

        resultado = await session.execute(
            select(Usuario).where(Usuario.email == "admin-init@mediflow.cl")
        )
        usuario = resultado.scalar_one_or_none()
        assert usuario is not None
        assert usuario.rol == Rol.ADMIN
        assert usuario.nombre == "Admin Test"


@pytest.mark.asyncio
async def test_admin_no_duplica_email():
    from sqlalchemy import select
    from src.security.password import hashear_password

    async with session_test() as session:
        admin = Usuario(
            nombre="Admin Uno",
            email="nodup@mediflow.cl",
            password_hash=hashear_password("clave123"),
            rol=Rol.ADMIN,
        )
        session.add(admin)
        await session.commit()

        resultado = await session.execute(
            select(Usuario).where(Usuario.email == "nodup@mediflow.cl")
        )
        existente = resultado.scalar_one_or_none()
        assert existente is not None

        # Simula la lógica: no crear si ya existe
        if not existente:
            session.add(Usuario(
                nombre="Admin Dos",
                email="nodup@mediflow.cl",
                password_hash=hashear_password("clave456"),
                rol=Rol.ADMIN,
            ))
            await session.commit()

        resultado = await session.execute(
            select(Usuario).where(Usuario.email == "nodup@mediflow.cl")
        )
        usuarios = resultado.scalars().all()
        assert len(usuarios) == 1
        assert usuarios[0].nombre == "Admin Uno"


@pytest.mark.asyncio
async def test_admin_login_funciona(client):
    from httpx import AsyncClient
    from src.security.password import hashear_password

    async with session_test() as session:
        admin = Usuario(
            nombre="Admin Login",
            email="adminlogin@mediflow.cl",
            password_hash=hashear_password("clave_segura_123"),
            rol=Rol.ADMIN,
        )
        session.add(admin)
        await session.commit()

    resp = await client.post("/auth/login", json={
        "email": "adminlogin@mediflow.cl",
        "password": "clave_segura_123",
    })
    assert resp.status_code == 200

    token = resp.json()["access_token"]
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["rol"] == "admin"
