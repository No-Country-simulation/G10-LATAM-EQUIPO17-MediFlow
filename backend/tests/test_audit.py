import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_request_id_en_respuesta(client: AsyncClient):
    resp = await client.get("/")
    assert "x-request-id" in resp.headers
    assert len(resp.headers["x-request-id"]) == 8


@pytest.mark.asyncio
async def test_audit_log_request_anonimo(client: AsyncClient, caplog):
    with caplog.at_level("INFO", logger="mediflow.audit"):
        resp = await client.get("/")
    assert resp.status_code == 200
    assert any("GET" in r.message and "user=-" in r.message for r in caplog.records)


@pytest.mark.asyncio
async def test_audit_log_request_autenticado(client: AsyncClient, headers_paciente, caplog):
    with caplog.at_level("INFO", logger="mediflow.audit"):
        resp = await client.get("/auth/me", headers=headers_paciente)
    assert resp.status_code == 200
    registros = [r for r in caplog.records if "GET" in r.message and "/auth/me" in r.message]
    assert len(registros) > 0
    assert "rol=paciente" in registros[0].message


@pytest.mark.asyncio
async def test_audit_log_warning_en_error(client: AsyncClient, caplog):
    with caplog.at_level("WARNING", logger="mediflow.audit"):
        resp = await client.get("/ruta/inexistente")
    assert resp.status_code == 404
    registros = [r for r in caplog.records if "404" in r.message]
    assert len(registros) > 0
    assert registros[0].levelname == "WARNING"


@pytest.mark.asyncio
async def test_request_id_unico_por_peticion(client: AsyncClient):
    resp1 = await client.get("/")
    resp2 = await client.get("/")
    id1 = resp1.headers["x-request-id"]
    id2 = resp2.headers["x-request-id"]
    assert id1 != id2
