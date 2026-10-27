from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from src.core.config import get_settings

settings = get_settings()

_engine_args = {"echo": settings.debug}
if settings.database_url_async.startswith("postgresql"):
    _engine_args["pool_size"] = 5
    _engine_args["max_overflow"] = 10
    _engine_args["pool_pre_ping"] = True

engine = create_async_engine(settings.database_url_async, **_engine_args)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def crear_tablas():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
