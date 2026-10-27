import pytest
import pytest_asyncio
from httpx import AsyncClient
from src.models.registro_triaje import RegistroTriaje
from src.core.database import get_db
from src.main import app


@pytest_asyncio.fixture
async def registro_triaje(client, usuario_registrado):
    from src.security.auth import verificar_token
    payload = verificar_token(usuario_registrado["access_token"])
    user_id = payload["sub"]

    registro = RegistroTriaje(
        bucket="mediflow-recibidos",
        ruta_documento="docs/test-doc.pdf",
        ruta_triaje="triaje/test-triaje.json",
        id_usuario=user_id,
    )
    override_fn = app.dependency_overrides[get_db]
    async for session in override_fn():
        session.add(registro)
        await session.commit()
        await session.refresh(registro)
    return {"id": registro.id, "id_usuario": user_id}


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
async def test_registros_triaje_paginacion(client: AsyncClient, headers_paciente):
    resp = await client.get(
        "/triaje/registros",
        params={"offset": 0, "limit": 10},
        headers=headers_paciente,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["limit"] == 10
    assert data["offset"] == 0
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_registros_triaje_paginacion_offset_alto(client: AsyncClient, headers_paciente):
    resp = await client.get(
        "/triaje/registros",
        params={"offset": 500, "limit": 50},
        headers=headers_paciente,
    )
    assert resp.status_code == 200
    assert resp.json()["items"] == []


@pytest.mark.asyncio
async def test_registros_triaje_como_admin(client: AsyncClient, usuario_admin):
    resp = await client.get("/triaje/registros", headers=usuario_admin["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_registros_triaje_sin_auth(client: AsyncClient):
    resp = await client.get("/triaje/registros")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_asignar_documento_como_admin(client: AsyncClient, usuario_admin, usuario_medico, registro_triaje):
    resp = await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_medico_asignado"] == usuario_medico["user_id"]
    assert data["fecha_asignacion"] is not None


@pytest.mark.asyncio
async def test_asignar_documento_registro_inexistente(client: AsyncClient, usuario_admin, usuario_medico):
    resp = await client.patch(
        "/triaje/registros/no-existe/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_asignar_documento_medico_inexistente(client: AsyncClient, usuario_admin, registro_triaje):
    resp = await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": "id-que-no-existe"},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 404
    assert "medico" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_asignar_documento_a_no_medico(client: AsyncClient, usuario_admin, usuario_registrado, registro_triaje):
    from src.security.auth import verificar_token
    payload = verificar_token(usuario_registrado["access_token"])
    paciente_id = payload["sub"]

    resp = await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": paciente_id},
        headers=usuario_admin["headers"],
    )
    assert resp.status_code == 400
    assert "MEDICO" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_asignar_documento_sin_permisos(client: AsyncClient, headers_paciente, usuario_medico, registro_triaje):
    resp = await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=headers_paciente,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_comentario_medico(client: AsyncClient, usuario_admin, usuario_medico, registro_triaje):
    await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=usuario_admin["headers"],
    )

    resp = await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/comentario",
        json={"comentario": "Documento revisado, diagnostico correcto."},
        headers=usuario_medico["headers"],
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["comentario_medico"] == "Documento revisado, diagnostico correcto."
    assert data["fecha_comentario"] is not None


@pytest.mark.asyncio
async def test_comentario_medico_no_asignado(client: AsyncClient, usuario_admin, usuario_medico, registro_triaje):
    from src.security.auth import crear_access_token
    otro_token = crear_access_token({"sub": "otro-medico-id", "rol": "medico"})

    await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=usuario_admin["headers"],
    )

    from sqlalchemy import update
    from src.models.usuario import Usuario
    from src.security.schemas import Rol

    otro_resp = await client.post("/auth/registro", json={
        "nombre": "Otro Medico",
        "email": "otro.medico@mediflow.cl",
        "password": "password123",
    })
    otro_data = otro_resp.json()
    from src.security.auth import verificar_token
    otro_payload = verificar_token(otro_data["access_token"])
    otro_id = otro_payload["sub"]

    override_fn = app.dependency_overrides[get_db]
    async for session in override_fn():
        await session.execute(
            update(Usuario).where(Usuario.id == otro_id).values(rol=Rol.MEDICO)
        )
        await session.commit()

    otro_token = crear_access_token({"sub": otro_id, "rol": Rol.MEDICO.value})
    resp = await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/comentario",
        json={"comentario": "Intento de comentar sin estar asignado"},
        headers={"Authorization": f"Bearer {otro_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_comentario_registro_inexistente(client: AsyncClient, usuario_medico):
    resp = await client.patch(
        "/triaje/registros/no-existe/comentario",
        json={"comentario": "Test"},
        headers=usuario_medico["headers"],
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_listar_asignados(client: AsyncClient, usuario_admin, usuario_medico, registro_triaje):
    await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=usuario_admin["headers"],
    )

    resp = await client.get("/triaje/registros/asignados", headers=usuario_medico["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any(r["id"] == registro_triaje["id"] for r in data["items"])


@pytest.mark.asyncio
async def test_listar_asignados_solo_pendientes(client: AsyncClient, usuario_admin, usuario_medico, registro_triaje):
    await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/asignar",
        json={"id_medico": usuario_medico["user_id"]},
        headers=usuario_admin["headers"],
    )

    resp = await client.get(
        "/triaje/registros/asignados",
        params={"solo_pendientes": True},
        headers=usuario_medico["headers"],
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1

    await client.patch(
        f"/triaje/registros/{registro_triaje['id']}/comentario",
        json={"comentario": "Revisado"},
        headers=usuario_medico["headers"],
    )

    resp = await client.get(
        "/triaje/registros/asignados",
        params={"solo_pendientes": True},
        headers=usuario_medico["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


@pytest.mark.asyncio
async def test_listar_asignados_sin_permisos(client: AsyncClient, headers_paciente):
    resp = await client.get("/triaje/registros/asignados", headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_listar_asignados_sin_auth(client: AsyncClient):
    resp = await client.get("/triaje/registros/asignados")
    assert resp.status_code in (401, 403)
