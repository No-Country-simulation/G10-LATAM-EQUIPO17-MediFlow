import logging

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from src.core.config import get_settings

logger = logging.getLogger("mediflow.database")

settings = get_settings()

_url = settings.database_url
if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+asyncpg://", 1)

_is_pg = "asyncpg" in _url
_connect_args = {}
_engine_kwargs = {}

if _is_pg:
    _connect_args["statement_cache_size"] = 0
    _engine_kwargs["pool_size"] = 2
    _engine_kwargs["max_overflow"] = 0
    _engine_kwargs["pool_pre_ping"] = True
    _engine_kwargs["pool_timeout"] = 10
    logger.info("Usando PostgreSQL (asyncpg) con PgBouncer config")

engine = create_async_engine(
    _url,
    echo=settings.debug,
    connect_args=_connect_args,
    **_engine_kwargs,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def crear_tablas():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
