from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.rate_limit import limiter
from src.models.registro_triaje import RegistroTriaje
from src.models.usuario import Usuario
from src.repository.auditoria_repository import AuditoriaRepository
from src.security import requiere_rol, Rol
from src.security.schemas import TokenPayload

router = APIRouter(prefix="/admin", tags=["Administracion"])


@router.get(
    "/estadisticas",
    summary="Estadisticas generales del sistema",
    description=(
        "Retorna metricas agregadas: usuarios por rol, usuarios activos/inactivos, "
        "total de triajes y triajes en los ultimos 7 dias. Solo accesible para ADMIN."
    ),
    responses={
        200: {"description": "Estadisticas del sistema"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — solo ADMIN"},
        429: {"description": "Limite de solicitudes excedido (10/min)"},
    },
)
@limiter.limit("10/minute")
async def obtener_estadisticas(
    request: Request,
    usuario: TokenPayload = Depends(requiere_rol(Rol.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    usuarios_por_rol = await db.execute(
        select(Usuario.rol, func.count()).group_by(Usuario.rol)
    )
    conteo_roles = {rol.value: total for rol, total in usuarios_por_rol.all()}

    usuarios_estado = await db.execute(
        select(Usuario.activo, func.count()).group_by(Usuario.activo)
    )
    estado_map = dict(usuarios_estado.all())

    total_triajes_result = await db.execute(select(func.count()).select_from(RegistroTriaje))
    total_triajes = total_triajes_result.scalar()

    hace_7_dias = datetime.now(timezone.utc) - timedelta(days=7)
    triajes_recientes_result = await db.execute(
        select(func.count()).select_from(RegistroTriaje).where(
            RegistroTriaje.created_at >= hace_7_dias
        )
    )
    triajes_recientes = triajes_recientes_result.scalar()

    return {
        "usuarios": {
            "por_rol": conteo_roles,
            "activos": estado_map.get(True, 0),
            "inactivos": estado_map.get(False, 0),
            "total": sum(estado_map.values()),
        },
        "triajes": {
            "total": total_triajes,
            "ultimos_7_dias": triajes_recientes,
        },
    }


@router.get(
    "/metricas/triaje",
    summary="Metricas detalladas de triaje",
    description=(
        "Retorna metricas sobre documentos procesados: total, asignados, "
        "pendientes de revision, comentados, y distribucion por bucket."
    ),
    responses={
        200: {"description": "Metricas de triaje"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — solo ADMIN"},
        429: {"description": "Limite de solicitudes excedido (10/min)"},
    },
)
@limiter.limit("10/minute")
async def metricas_triaje(
    request: Request,
    usuario: TokenPayload = Depends(requiere_rol(Rol.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(select(func.count()).select_from(RegistroTriaje))
    total = total_result.scalar()

    asignados_result = await db.execute(
        select(func.count()).select_from(RegistroTriaje).where(
            RegistroTriaje.id_medico_asignado.isnot(None)
        )
    )
    asignados = asignados_result.scalar()

    pendientes_result = await db.execute(
        select(func.count()).select_from(RegistroTriaje).where(
            RegistroTriaje.id_medico_asignado.isnot(None),
            RegistroTriaje.comentario_medico.is_(None),
        )
    )
    pendientes_revision = pendientes_result.scalar()

    comentados_result = await db.execute(
        select(func.count()).select_from(RegistroTriaje).where(
            RegistroTriaje.comentario_medico.isnot(None)
        )
    )
    comentados = comentados_result.scalar()

    por_bucket_result = await db.execute(
        select(RegistroTriaje.bucket, func.count()).group_by(RegistroTriaje.bucket)
    )
    por_bucket = {bucket: count for bucket, count in por_bucket_result.all()}

    hace_30_dias = datetime.now(timezone.utc) - timedelta(days=30)
    recientes_result = await db.execute(
        select(func.count()).select_from(RegistroTriaje).where(
            RegistroTriaje.created_at >= hace_30_dias
        )
    )
    recientes = recientes_result.scalar()

    return {
        "total": total,
        "asignados": asignados,
        "pendientes_revision": pendientes_revision,
        "comentados": comentados,
        "sin_asignar": total - asignados,
        "por_bucket": por_bucket,
        "ultimos_30_dias": recientes,
    }


@router.get(
    "/auditoria",
    summary="Consultar registros de auditoria",
    description=(
        "Retorna registros de auditoria persistidos, con filtros opcionales "
        "por usuario, metodo HTTP, rango de status y fechas."
    ),
    responses={
        200: {"description": "Lista paginada de registros de auditoria"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — solo ADMIN"},
        429: {"description": "Limite de solicitudes excedido (10/min)"},
    },
)
@limiter.limit("10/minute")
async def consultar_auditoria(
    request: Request,
    usuario_id: str | None = Query(default=None, description="Filtrar por ID de usuario"),
    metodo: str | None = Query(default=None, description="Filtrar por metodo HTTP"),
    status_min: int | None = Query(default=None, ge=100, le=599, description="Status code minimo"),
    status_max: int | None = Query(default=None, ge=100, le=599, description="Status code maximo"),
    desde: datetime | None = Query(default=None, description="Fecha inicio (ISO 8601)"),
    hasta: datetime | None = Query(default=None, description="Fecha fin (ISO 8601)"),
    offset: int = Query(default=0, ge=0, description="Registros a saltar"),
    limit: int = Query(default=50, ge=1, le=200, description="Cantidad maxima de resultados"),
    admin: TokenPayload = Depends(requiere_rol(Rol.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    repo = AuditoriaRepository(db)
    registros, total = await repo.find_all(
        usuario_id=usuario_id,
        metodo=metodo,
        status_min=status_min,
        status_max=status_max,
        desde=desde,
        hasta=hasta,
        offset=offset,
        limit=limit,
    )
    return {"items": registros, "total": total, "offset": offset, "limit": limit}
