import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import delete

from sqlalchemy import select

from src.core.config import get_settings
from src.core.database import crear_tablas, async_session
from src.core.rate_limit import limiter
from src.middleware.audit import AuditMiddleware
from src.models import Usuario, TokenRevocado
from src.routers import triaje_router, storage_router, auth_router
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
    log = logging.getLogger("mediflow.startup")
    try:
        log.info("Validando configuracion...")
        settings.validar_produccion()
        log.info("Creando tablas...")
        await asyncio.wait_for(crear_tablas(), timeout=15)
        log.info("Tablas creadas OK")
        eliminados = await purgar_tokens_expirados()
        if eliminados:
            log.info("Tokens expirados purgados: %d", eliminados)
        await crear_admin_inicial()
        log.info("Startup completo")
    except Exception as e:
        log.error("Error en startup: %s", e, exc_info=True)
        raise
    yield


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

logging_cfg = logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

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


#origins = [o.strip() for o in settings.allowed_origins.split(",")]
# usa_credenciales = "*" not in origins
 
origins = [
    "https://g10-latam-equipo-17-medi-flow.vercel.app",
    "http://localhost:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(triaje_router)
app.include_router(storage_router)


@app.get("/", tags=["Root"])
async def root():
    return {"app": "MediFlow", "version": "0.1.0", "docs": "/docs"}
