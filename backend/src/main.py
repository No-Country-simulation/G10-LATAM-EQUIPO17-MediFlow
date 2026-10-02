from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import delete

from src.core.config import get_settings
from src.core.database import crear_tablas, async_session
from src.core.rate_limit import limiter
from src.models import Usuario, TokenRevocado
from src.routers import triaje_router, storage_router, auth_router


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
        import logging
        logging.getLogger("mediflow").info("Tokens expirados purgados: %d", eliminados)
    yield


settings = get_settings()

app = FastAPI(
    title="MediFlow API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.es_produccion else "/docs",
    redoc_url=None if settings.es_produccion else "/redoc",
)

app.state.limiter = limiter


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
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


@app.get("/", tags=["Root"])
async def root():
    return {"app": "MediFlow", "version": "0.1.0", "docs": "/docs"}
