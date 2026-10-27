import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_general(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "estado" in data
    assert "componentes" in data
    assert "timestamp" in data
    assert "base_datos" in data["componentes"]


@pytest.mark.asyncio
async def test_storage_health_sin_admin(client: AsyncClient, headers_paciente):
    resp = await client.get("/storage/health", headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_storage_health_como_admin(client: AsyncClient, usuario_admin):
    resp = await client.get("/storage/health", headers=usuario_admin["headers"])
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_listar_documentos_sin_auth(client: AsyncClient):
    resp = await client.get("/storage/documentos", params={"estado": "recibido"})
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_listar_documentos_como_paciente_denegado(client: AsyncClient, headers_paciente):
    resp = await client.get(
        "/storage/documentos",
        params={"estado": "recibido"},
        headers=headers_paciente,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_listar_documentos_como_admin(client: AsyncClient, usuario_admin):
    resp = await client.get(
        "/storage/documentos",
        params={"estado": "recibido"},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_descargar_documento_sin_auth(client: AsyncClient):
    resp = await client.get("/storage/descargar/bucket/archivo.pdf")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app"] == "MediFlow"
