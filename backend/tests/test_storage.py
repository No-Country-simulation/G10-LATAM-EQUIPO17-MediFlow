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
async def test_mover_documento_como_medico(client: AsyncClient, usuario_medico):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC-001",
        "ruta_objeto": "paciente1/resultado.pdf",
        "bucket_origen": "mediflow-recibidos",
        "estado_destino": "procesado",
    }, headers=usuario_medico["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["exito"] is True
    assert data["documento_id"] == "DOC-001"
    assert data["estado_nuevo"] == "procesado"


@pytest.mark.asyncio
async def test_mover_documento_como_admin(client: AsyncClient, usuario_admin):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC-002",
        "ruta_objeto": "paciente2/examen.pdf",
        "bucket_origen": "mediflow-procesados",
        "estado_destino": "auditoria_humana",
    }, headers=usuario_admin["headers"])
    assert resp.status_code == 200
    assert resp.json()["exito"] is True


@pytest.mark.asyncio
async def test_mover_documento_como_paciente_denegado(client: AsyncClient, headers_paciente):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC-003",
        "ruta_objeto": "archivo.pdf",
        "bucket_origen": "mediflow-recibidos",
        "estado_destino": "procesado",
    }, headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_mover_documento_sin_auth(client: AsyncClient):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC-004",
        "ruta_objeto": "archivo.pdf",
        "bucket_origen": "mediflow-recibidos",
        "estado_destino": "procesado",
    })
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_mover_documento_bucket_invalido(client: AsyncClient, usuario_medico):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC-005",
        "ruta_objeto": "archivo.pdf",
        "bucket_origen": "bucket-no-existe",
        "estado_destino": "procesado",
    }, headers=usuario_medico["headers"])
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_mover_documento_ruta_path_traversal(client: AsyncClient, usuario_medico):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC-006",
        "ruta_objeto": "../../../etc/passwd",
        "bucket_origen": "mediflow-recibidos",
        "estado_destino": "procesado",
    }, headers=usuario_medico["headers"])
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_mover_documento_id_invalido(client: AsyncClient, usuario_medico):
    resp = await client.post("/storage/documentos/mover", json={
        "documento_id": "DOC 006 INVALID!@#",
        "ruta_objeto": "archivo.pdf",
        "bucket_origen": "mediflow-recibidos",
        "estado_destino": "procesado",
    }, headers=usuario_medico["headers"])
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app"] == "MediFlow"
