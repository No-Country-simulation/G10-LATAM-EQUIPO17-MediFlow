import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import delete, select, text

from src.core.config import get_settings
from src.core.database import crear_tablas, async_session
from src.core.rate_limit import limiter
from src.middleware.audit import AuditMiddleware
from src.services.oci_storage import MediFlowStorage
from src.models import Usuario, TokenRevocado
from src.routers import admin_router, triaje_router, storage_router, auth_router
from src.security.password import hashear_password
from src.security.schemas import Rol


async def crear_admin_inicial():
    if not all([settings.admin_email, settings.admin_password, settings.admin_nombre]):
        return

    async with async_session() as session:
        resultado = await session.execute(
            select(Usuario).where(Usuario.email == settings.admin_email)
        )
        if resultado.scalar_one_or_none():
            return

        admin = Usuario(
            nombre=settings.admin_nombre,
            email=settings.admin_email,
            password_hash=hashear_password(settings.admin_password),
            rol=Rol.ADMIN,
        )
        session.add(admin)
        await session.commit()
        logging.getLogger("mediflow").info("Admin inicial creado: %s", settings.admin_email)


async def purgar_tokens_expirados():
    async with async_session() as session:
        resultado = await session.execute(
            delete(TokenRevocado).where(TokenRevocado.expira_en < datetime.now(timezone.utc))
        )
        await session.commit()
        return resultado.rowcount


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validar_produccion()
    await crear_tablas()
    eliminados = await purgar_tokens_expirados()
    if eliminados:
        logging.getLogger("mediflow").info("Tokens expirados purgados: %d", eliminados)
    await crear_admin_inicial()

    async def purga_periodica():
        while True:
            await asyncio.sleep(3600)
            try:
                n = await purgar_tokens_expirados()
                if n:
                    logging.getLogger("mediflow").info("Purga periodica: %d tokens eliminados", n)
            except Exception as e:
                logging.getLogger("mediflow").error("Error en purga periodica: %s", str(e))

    tarea_purga = asyncio.create_task(purga_periodica())
    yield
    tarea_purga.cancel()
    try:
        await tarea_purga
    except asyncio.CancelledError:
        pass


settings = get_settings()

app = FastAPI(
    title="MediFlow API",
    version="0.1.0",
    description=(
        "API de triaje clinico inteligente. Clasifica, extrae datos y enruta "
        "documentos medicos hacia los destinos correspondientes, con almacenamiento "
        "seguro en OCI Object Storage."
    ),
    lifespan=lifespan,
    docs_url=None if settings.es_produccion else "/docs",
    redoc_url=None if settings.es_produccion else "/redoc",
)

app.state.limiter = limiter

from pythonjsonlogger.json import JsonFormatter

json_handler = logging.StreamHandler()
json_handler.setFormatter(JsonFormatter(
    fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    rename_fields={"asctime": "timestamp", "name": "logger", "levelname": "level"},
))
logging.root.handlers = [json_handler]
logging.root.setLevel(logging.INFO)

app.add_middleware(AuditMiddleware)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    if request.url.path in ("/docs", "/redoc", "/openapi.json"):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https://fastapi.tiangolo.com"
        )
    else:
        response.headers["Content-Security-Policy"] = "default-src 'none'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if settings.es_produccion:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Demasiadas solicitudes, intenta mas tarde"},
    )


origins = [o.strip() for o in settings.allowed_origins.split(",")]
usa_credenciales = "*" not in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=usa_credenciales,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(triaje_router)
app.include_router(storage_router)
app.include_router(admin_router)


@app.get("/health", tags=["Health"])
@limiter.limit("30/minute")
async def health_check(request: Request):
    componentes = {}

    try:
        inicio = time.monotonic()
        async with async_session() as db:
            await db.execute(text("SELECT 1"))
        latencia = round((time.monotonic() - inicio) * 1000, 1)
        componentes["base_datos"] = {"estado": "ok", "latencia_ms": latencia}
    except Exception:
        componentes["base_datos"] = {"estado": "error"}

    try:
        storage = MediFlowStorage(settings)
        resultado_oci = storage.verificar_conexion()
        componentes["oci"] = {"estado": "ok" if resultado_oci.get("oci_conectado") else "error"}
    except Exception:
        componentes["oci"] = {"estado": "no_configurado"}

    estados = [c["estado"] if isinstance(c, dict) else c for c in componentes.values()]
    if all(e == "ok" for e in estados):
        estado = "ok"
    elif "error" in estados:
        estado = "degradado" if "ok" in estados else "error"
    else:
        estado = "ok"

    return {
        "estado": estado,
        "componentes": componentes,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", tags=["Root"])
async def root():
    return {"app": "MediFlow", "version": "0.1.0", "docs": "/docs"}
