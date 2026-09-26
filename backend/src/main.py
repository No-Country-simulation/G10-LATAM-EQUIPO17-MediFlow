from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from src.core.config import get_settings
from src.core.database import crear_tablas
from src.core.rate_limit import limiter
from src.models import Usuario, TokenRevocado
from src.routers import triaje_router, storage_router, auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await crear_tablas()
    yield


settings = get_settings()

app = FastAPI(
    title="MediFlow API",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Demasiadas solicitudes, intenta mas tarde"},
    )


origins = [o.strip() for o in settings.allowed_origins.split(",")] if settings.allowed_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(triaje_router)
app.include_router(storage_router)


@app.get("/", tags=["Root"])
async def root():
    return {"app": "MediFlow", "version": "0.1.0", "docs": "/docs"}
