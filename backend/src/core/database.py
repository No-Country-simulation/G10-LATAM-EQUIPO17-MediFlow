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
    logger.info("PostgreSQL detectado, statement_cache_size=0")

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
        if _is_pg:
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
