import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_registro_exitoso(client: AsyncClient):
    resp = await client.post("/auth/registro", json={
        "nombre": "María López",
        "email": "maria@mediflow.cl",
        "password": "clave_segura_123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_registro_email_duplicado(client: AsyncClient):
    payload = {
        "nombre": "Usuario Uno",
        "email": "duplicado@mediflow.cl",
        "password": "clave_segura_123",
    }
    await client.post("/auth/registro", json=payload)
    resp = await client.post("/auth/registro", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_registro_password_corta(client: AsyncClient):
    resp = await client.post("/auth/registro", json={
        "nombre": "Test",
        "email": "corta@mediflow.cl",
        "password": "123",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_registro_email_invalido(client: AsyncClient):
    resp = await client.post("/auth/registro", json={
        "nombre": "Test",
        "email": "no-es-email",
        "password": "clave_segura_123",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_exitoso(client: AsyncClient):
    await client.post("/auth/registro", json={
        "nombre": "Login Test",
        "email": "login@mediflow.cl",
        "password": "clave_segura_123",
    })
    resp = await client.post("/auth/login", json={
        "email": "login@mediflow.cl",
        "password": "clave_segura_123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_credenciales_invalidas(client: AsyncClient):
    resp = await client.post("/auth/login", json={
        "email": "noexiste@mediflow.cl",
        "password": "cualquier_cosa",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_password_incorrecta(client: AsyncClient):
    await client.post("/auth/registro", json={
        "nombre": "Test",
        "email": "pwd@mediflow.cl",
        "password": "clave_correcta_123",
    })
    resp = await client.post("/auth/login", json={
        "email": "pwd@mediflow.cl",
        "password": "clave_incorrecta",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_perfil_autenticado(client: AsyncClient, headers_paciente):
    resp = await client.get("/auth/me", headers=headers_paciente)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@mediflow.cl"
    assert data["rol"] == "paciente"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, usuario_registrado):
    resp = await client.post("/auth/refresh", json={
        "refresh_token": usuario_registrado["refresh_token"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_refresh_token_invalido(client: AsyncClient):
    resp = await client.post("/auth/refresh", json={
        "refresh_token": "token.invalido.falso",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, usuario_registrado):
    resp = await client.post("/auth/logout", json={
        "refresh_token": usuario_registrado["refresh_token"],
    })
    assert resp.status_code == 200

    resp = await client.post("/auth/refresh", json={
        "refresh_token": usuario_registrado["refresh_token"],
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_listar_usuarios_como_admin(client: AsyncClient, usuario_admin):
    resp = await client.get("/auth/usuarios", headers=usuario_admin["headers"])
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_listar_usuarios_como_paciente_denegado(client: AsyncClient, headers_paciente):
    resp = await client.get("/auth/usuarios", headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cambiar_rol(client: AsyncClient, usuario_admin, usuario_registrado):
    from src.security.auth import verificar_token
    payload = verificar_token(usuario_registrado["access_token"])
    user_id = payload["sub"]

    resp = await client.patch(
        f"/auth/usuarios/{user_id}/rol",
        json={"rol": "medico"},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["rol"] == "medico"


@pytest.mark.asyncio
async def test_cambiar_rol_propio_denegado(client: AsyncClient, usuario_admin):
    resp = await client.patch(
        f"/auth/usuarios/{usuario_admin['user_id']}/rol",
        json={"rol": "paciente"},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 400
