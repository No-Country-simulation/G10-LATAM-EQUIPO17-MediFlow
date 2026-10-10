import logging

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.rate_limit import limiter
from src.repository.registro_triaje_repository import RegistroTriajeRepository
from src.schemas.documento import SolicitudTriaje, RespuestaTriaje, RegistroTriajeResponse
from src.security import obtener_usuario_actual, requiere_rol, Rol
from src.security.schemas import TokenPayload
from src.services.graph import procesar_solicitud_triaje

logger = logging.getLogger("mediflow.triaje")

router = APIRouter(prefix="/triaje", tags=["Triaje Clínico"])

TIPOS_ARCHIVO_PERMITIDOS = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
MAX_ARCHIVO_BYTES = 10 * 1024 * 1024


def get_registro_triaje_repository(db: AsyncSession = Depends(get_db)) -> RegistroTriajeRepository:
    return RegistroTriajeRepository(db)


@router.get(
    "/registros",
    response_model=list[RegistroTriajeResponse],
    summary="Consultar registros de triaje",
    description=(
        "Retorna los registros de triaje del usuario autenticado. "
        "Si el usuario es ADMIN, retorna todos los registros del sistema."
    ),
    responses={
        200: {"description": "Lista de registros de triaje"},
        401: {"description": "Token invalido o expirado"},
        429: {"description": "Limite de solicitudes excedido (30/min)"},
    },
)
@limiter.limit("30/minute")
async def listar_registros_triaje(
    request: Request,
    usuario: TokenPayload = Depends(obtener_usuario_actual),
    repositorio_triaje: RegistroTriajeRepository = Depends(get_registro_triaje_repository)
):
    if usuario.rol == Rol.ADMIN:
        return await repositorio_triaje.find_all()
    return await repositorio_triaje.find_by_usuario(usuario.sub)


@router.post(
    "/",
    response_model=RespuestaTriaje,
    summary="Procesar triaje de texto",
    description=(
        "Recibe un documento clinico en texto plano, ejecuta el pipeline de triaje "
        "(clasificacion, extraccion de datos, enrutamiento) y almacena el resultado en OCI."
    ),
    responses={
        200: {"description": "Resultado del triaje procesado"},
        400: {"description": "Texto del documento no proporcionado"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Rol sin permisos para esta operacion"},
        429: {"description": "Limite de solicitudes excedido (30/min)"},
        500: {"description": "Error interno del pipeline de triaje"},
    },
)
@limiter.limit("30/minute")
async def procesar_triaje(
    request: Request,
    solicitud: SolicitudTriaje,
    usuario: TokenPayload = Depends(requiere_rol(Rol.PACIENTE, Rol.MEDICO, Rol.ADMIN)),
    repositorio_triaje: RegistroTriajeRepository = Depends(get_registro_triaje_repository),
):
    if not solicitud.documento_texto:
        raise HTTPException(status_code=400, detail="documento_texto es requerido para triaje de texto")

    try:
        return await procesar_solicitud_triaje(
            solicitud=solicitud,
            es_texto=True,
            usuario_id=usuario.sub,
            repositorio_triaje=repositorio_triaje,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error en triaje texto %s: %s", solicitud.documento_id, str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno procesando el triaje")


@router.post(
    "/archivo",
    response_model=RespuestaTriaje,
    summary="Procesar triaje desde archivo",
    description=(
        "Recibe un archivo clinico (PDF, PNG, JPG), ejecuta el pipeline de triaje "
        "con procesamiento de imagen/documento y almacena el resultado en OCI. "
        "Limite de archivo: 10 MB."
    ),
    responses={
        200: {"description": "Resultado del triaje procesado"},
        400: {"description": "Tipo de archivo no soportado o extension invalida"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Rol sin permisos para esta operacion"},
        413: {"description": "Archivo excede el limite de 10 MB"},
        429: {"description": "Limite de solicitudes excedido (15/min)"},
        500: {"description": "Error interno del pipeline de triaje"},
    },
)
@limiter.limit("15/minute")
async def procesar_triaje_archivo(
    request: Request,
    archivo: UploadFile = File(..., description="Archivo clinico (PDF, PNG, JPG/JPEG)"),
    documento_id: str = Form(..., description="Identificador unico del documento"),
    canal_origen: str = Form(default="manual", description="Canal de ingreso del documento"),
    usuario: TokenPayload = Depends(requiere_rol(Rol.PACIENTE, Rol.MEDICO, Rol.ADMIN)),
    repositorio_triaje: RegistroTriajeRepository = Depends(get_registro_triaje_repository)
):
    if archivo.content_type not in TIPOS_ARCHIVO_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo no soportado: {archivo.content_type}. Permitidos: {TIPOS_ARCHIVO_PERMITIDOS}",
        )

    ext = archivo.filename.rsplit(".", 1)[-1].lower() if archivo.filename and "." in archivo.filename else None
    if not ext or ext not in {"pdf", "png", "jpg", "jpeg"}:
        raise HTTPException(status_code=400, detail="Extension de archivo no valida")

    chunks = []
    total = 0
    while chunk := await archivo.read(65536):
        total += len(chunk)
        if total > MAX_ARCHIVO_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Archivo excede el limite de {MAX_ARCHIVO_BYTES // (1024 * 1024)} MB",
            )
        chunks.append(chunk)
    contenido = b"".join(chunks)

    solicitud = SolicitudTriaje(
        documento_id=documento_id,
        tipo_archivo=ext,
        canal_origen=canal_origen,
    )

    try:
        return await procesar_solicitud_triaje(
            solicitud=solicitud,
            es_texto=False,
            archivo_bytes=contenido,
            nombre_archivo=archivo.filename,
            usuario_id=usuario.sub,
            repositorio_triaje=repositorio_triaje,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error en triaje archivo %s: %s", documento_id, str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno procesando el archivo")
