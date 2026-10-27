import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_estadisticas_como_admin(client: AsyncClient, usuario_admin):
    resp = await client.get("/admin/estadisticas", headers=usuario_admin["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "usuarios" in data
    assert "triajes" in data
    assert "por_rol" in data["usuarios"]
    assert "total" in data["usuarios"]
    assert "total" in data["triajes"]


@pytest.mark.asyncio
async def test_estadisticas_sin_admin_denegado(client: AsyncClient, headers_paciente):
    resp = await client.get("/admin/estadisticas", headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_estadisticas_sin_auth(client: AsyncClient):
    resp = await client.get("/admin/estadisticas")
    assert resp.status_code in (401, 403)
