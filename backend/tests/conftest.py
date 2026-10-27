import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

os.environ.update({
    "DATABASE_URL": "sqlite+aiosqlite:///:memory:",
    "JWT_SECRET_KEY": "test-secret-key-solo-para-testing-no-prod",
    "ALLOWED_ORIGINS": "http://localhost:3000",
    "LLM_API_KEY": "test",
    "API_KEY_GROQ": "test",
    "GOOGLE_API_KEY": "test",
})

from src.core.database import Base, get_db
from src.core.rate_limit import limiter
from src.routers.storage import get_storage
from src.main import app

limiter.enabled = False


class StorageMock:
    def verificar_conexion(self):
        return {"oci_conectado": True}

    def listar_documentos(self, **kwargs):
        return []

    def obtener_documento(self, bucket, ruta):
        return (b"", {"content-type": "application/pdf"})

    def mover_documento(self, documento_id, ruta_objeto, bucket_origen, estado_destino):
        from src.schemas.documento import ResultadoMovimiento, EstadoDocumento
        estado = estado_destino if isinstance(estado_destino, EstadoDocumento) else EstadoDocumento(estado_destino)
        return ResultadoMovimiento(
            exito=True,
            documento_id=documento_id,
            bucket_origen=bucket_origen,
            bucket_destino=f"mediflow-{estado.value}",
            ruta_origen=ruta_objeto,
            ruta_destino=ruta_objeto,
            estado_nuevo=estado,
        )


app.dependency_overrides[get_storage] = lambda: StorageMock()


engine_test = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
session_test = async_sessionmaker(engine_test, expire_on_commit=False)


async def override_get_db():
    async with session_test() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def usuario_registrado(client: AsyncClient):
    resp = await client.post("/auth/registro", json={
        "nombre": "Test User",
        "email": "test@mediflow.cl",
        "password": "Test@1234",
    })
    return resp.json()


@pytest_asyncio.fixture
async def headers_paciente(usuario_registrado):
    return {"Authorization": f"Bearer {usuario_registrado['access_token']}"}


@pytest_asyncio.fixture
async def usuario_admin(client: AsyncClient):
    resp = await client.post("/auth/registro", json={
        "nombre": "Admin User",
        "email": "admin@mediflow.cl",
        "password": "Test@1234",
    })
    data = resp.json()

    from sqlalchemy import update
    from src.models.usuario import Usuario
    from src.security.schemas import Rol
    from src.security.auth import crear_access_token

    async with session_test() as session:
        token_payload = {"sub": data["access_token"], "rol": "admin"}
        from src.security.auth import verificar_token
        payload = verificar_token(data["access_token"])
        user_id = payload["sub"]

        await session.execute(
            update(Usuario).where(Usuario.id == user_id).values(rol=Rol.ADMIN)
        )
        await session.commit()

    token = crear_access_token({"sub": user_id, "rol": Rol.ADMIN.value})
    return {
        "access_token": token,
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def usuario_medico(client: AsyncClient):
    resp = await client.post("/auth/registro", json={
        "nombre": "Medico User",
        "email": "medico@mediflow.cl",
        "password": "Test@1234",
    })
    data = resp.json()

    from sqlalchemy import update
    from src.models.usuario import Usuario
    from src.security.schemas import Rol
    from src.security.auth import crear_access_token, verificar_token

    async with session_test() as session:
        payload = verificar_token(data["access_token"])
        user_id = payload["sub"]

        await session.execute(
            update(Usuario).where(Usuario.id == user_id).values(rol=Rol.MEDICO)
        )
        await session.commit()

    token = crear_access_token({"sub": user_id, "rol": Rol.MEDICO.value})
    return {
        "access_token": token,
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {token}"},
    }
