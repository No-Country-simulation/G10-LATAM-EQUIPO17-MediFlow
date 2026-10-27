from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.rate_limit import limiter
from src.models.registro_triaje import RegistroTriaje
from src.models.usuario import Usuario
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
