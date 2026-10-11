import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_acceso_sin_token(client: AsyncClient):
    endpoints = [
        ("GET", "/auth/me"),
        ("GET", "/auth/usuarios"),
        ("GET", "/triaje/registros"),
        ("GET", "/storage/health"),
    ]
    for method, path in endpoints:
        resp = await client.request(method, path)
        assert resp.status_code in (401, 403), f"{method} {path} deberia requerir auth"


@pytest.mark.asyncio
async def test_token_invalido(client: AsyncClient):
    headers = {"Authorization": "Bearer token.completamente.invalido"}
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_token_expirado(client: AsyncClient):
    import jwt
    from datetime import datetime, timezone, timedelta

    payload = {
        "sub": "user-id-fake",
        "rol": "paciente",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "type": "access",
    }
    token = jwt.encode(
        payload,
        "test-secret-key-solo-para-testing-no-prod",
        algorithm="HS256",
    )
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_como_access_rechazado(client: AsyncClient, usuario_registrado):
    headers = {"Authorization": f"Bearer {usuario_registrado['refresh_token']}"}
    resp = await client.get("/auth/me", headers=headers)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_rol_insuficiente_storage(client: AsyncClient, headers_paciente):
    resp = await client.get("/storage/health", headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_rol_insuficiente_listar_usuarios(client: AsyncClient, headers_paciente):
    resp = await client.get("/auth/usuarios", headers=headers_paciente)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_security_headers(client: AsyncClient):
    resp = await client.get("/")
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-xss-protection") == "0"
    assert "default-src" in resp.headers.get("content-security-policy", "")
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in resp.headers.get("permissions-policy", "")


@pytest.mark.asyncio
async def test_path_traversal_rechazado(client: AsyncClient, headers_paciente):
    resp = await client.get(
        "/storage/documentos/mediflow-recibidos/docs%2F..%2F..%2Fetc%2Fpasswd",
        headers=headers_paciente,
    )
    assert resp.status_code == 400
    assert "no permitida" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_path_absoluto_rechazado(client: AsyncClient, headers_paciente):
    resp = await client.get(
        "/storage/documentos/mediflow-recibidos//etc/passwd",
        headers=headers_paciente,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_bucket_no_permitido(client: AsyncClient, headers_paciente):
    resp = await client.get(
        "/storage/documentos/bucket-inventado/archivo.pdf",
        headers=headers_paciente,
    )
    assert resp.status_code == 400
    assert "no permitido" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_validacion_produccion_jwt_default():
    from src.core.config import Settings

    settings = Settings(
        jwt_secret_key="mediflow-dev-secret-cambiar-en-prod",
        oci_private_key_base64="key",
        oci_user="user",
        oci_tenancy="tenancy",
    )
    with pytest.raises(RuntimeError, match="JWT_SECRET_KEY no puede usar el valor por defecto"):
        settings.validar_produccion()


@pytest.mark.asyncio
async def test_validacion_produccion_jwt_corta():
    from src.core.config import Settings

    settings = Settings(
        jwt_secret_key="corta",
        oci_private_key_base64="key",
        oci_user="user",
        oci_tenancy="tenancy",
    )
    with pytest.raises(RuntimeError, match="al menos 32 caracteres"):
        settings.validar_produccion()


@pytest.mark.asyncio
async def test_validacion_produccion_cors_wildcard():
    from src.core.config import Settings

    settings = Settings(
        jwt_secret_key="a" * 32,
        allowed_origins="*",
        oci_private_key_base64="key",
        oci_user="user",
        oci_tenancy="tenancy",
    )
    with pytest.raises(RuntimeError, match="ALLOWED_ORIGINS"):
        settings.validar_produccion()
