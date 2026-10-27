import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_triaje_sin_autenticacion(client: AsyncClient):
    resp = await client.post("/triaje/", json={
        "documento_id": "doc-001",
        "documento_texto": "Paciente con dolor abdominal",
    })
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_triaje_texto_vacio(client: AsyncClient, headers_paciente):
    resp = await client.post("/triaje/", json={
        "documento_id": "doc-001",
        "documento_texto": "",
    }, headers=headers_paciente)
    assert resp.status_code in (400, 422)


@pytest.mark.asyncio
async def test_triaje_archivo_tipo_no_permitido(client: AsyncClient, headers_paciente):
    resp = await client.post(
        "/triaje/archivo",
        files={"archivo": ("malware.exe", b"contenido falso", "application/x-msdownload")},
        data={"documento_id": "doc-002", "canal_origen": "manual"},
        headers=headers_paciente,
    )
    assert resp.status_code == 400
    assert "no soportado" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_triaje_archivo_extension_invalida(client: AsyncClient, headers_paciente):
    resp = await client.post(
        "/triaje/archivo",
        files={"archivo": ("archivo.txt", b"contenido", "application/pdf")},
        data={"documento_id": "doc-003", "canal_origen": "manual"},
        headers=headers_paciente,
    )
    assert resp.status_code == 400
    assert "extension" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_triaje_archivo_excede_limite(client: AsyncClient, headers_paciente):
    contenido = b"x" * (10 * 1024 * 1024 + 1)
    resp = await client.post(
        "/triaje/archivo",
        files={"archivo": ("grande.pdf", contenido, "application/pdf")},
        data={"documento_id": "doc-004", "canal_origen": "manual"},
        headers=headers_paciente,
    )
    assert resp.status_code == 413


@pytest.mark.asyncio
async def test_registros_triaje_autenticado(client: AsyncClient, headers_paciente):
    resp = await client.get("/triaje/registros", headers=headers_paciente)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["offset"] == 0


@pytest.mark.asyncio
async def test_registros_triaje_sin_auth(client: AsyncClient):
    resp = await client.get("/triaje/registros")
    assert resp.status_code in (401, 403)
