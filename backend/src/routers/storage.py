from fastapi import APIRouter, Depends, HTTPException, Query, Request

from src.core.config import Settings, get_settings
from src.core.exceptions import BucketNoEncontradoError, ConfiguracionOCIError, DocumentoNoEncontradoError
from src.core.rate_limit import limiter
from src.schemas.documento import EstadoDocumento
from src.security import requiere_rol, Rol
from src.security.schemas import TokenPayload
from src.services.oci_storage import MediFlowStorage

router = APIRouter(prefix="/storage", tags=["OCI Object Storage"])


def get_storage(settings: Settings = Depends(get_settings)) -> MediFlowStorage:
    return MediFlowStorage(settings)


@router.get(
    "/health",
    summary="Verificar conexion con OCI",
    description=(
        "Valida la conectividad con los tres buckets de OCI "
        "(recibidos, procesados, auditoria). Solo accesible para ADMIN."
    ),
    responses={
        200: {"description": "Conexion exitosa con todos los buckets"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — solo ADMIN"},
        429: {"description": "Limite de solicitudes excedido (10/min)"},
        503: {"description": "OCI no disponible o buckets no encontrados"},
    },
)
@limiter.limit("10/minute")
async def health_check(
    request: Request,
    usuario: TokenPayload = Depends(requiere_rol(Rol.ADMIN)),
    storage: MediFlowStorage = Depends(get_storage),
):
    try:
        resultado = storage.verificar_conexion()
        if not resultado["oci_conectado"]:
            raise HTTPException(status_code=503, detail={"mensaje": "Buckets no disponibles", **resultado})
        return resultado
    except ConfiguracionOCIError as e:
        raise HTTPException(status_code=503, detail={"mensaje": e.mensaje, "codigo": e.codigo})


@router.get(
    "/documentos",
    summary="Listar documentos por estado",
    description=(
        "Retorna los documentos almacenados en OCI filtrados por estado "
        "(recibido, procesado, auditoria_humana). Soporta filtro por prefijo y paginacion."
    ),
    responses={
        200: {"description": "Lista de documentos"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — requiere MEDICO o ADMIN"},
        404: {"description": "Bucket no encontrado en OCI"},
        429: {"description": "Limite de solicitudes excedido (30/min)"},
    },
)
@limiter.limit("30/minute")
async def listar_documentos(
    request: Request,
    estado: EstadoDocumento = Query(..., description="Estado del documento en el flujo de triaje"),
    prefijo: str | None = Query(default=None, description="Prefijo de ruta para filtrar objetos"),
    limite: int = Query(default=50, ge=1, le=500, description="Cantidad maxima de resultados"),
    usuario: TokenPayload = Depends(requiere_rol(Rol.MEDICO, Rol.ADMIN)),
    storage: MediFlowStorage = Depends(get_storage),
):
    try:
        return storage.listar_documentos(estado=estado, prefijo=prefijo, limite=limite)
    except BucketNoEncontradoError as e:
        raise HTTPException(status_code=404, detail=e.mensaje)


@router.get(
    "/documentos/{bucket}/{ruta_objeto:path}",
    summary="Obtener metadata de un documento",
    description=(
        "Retorna la metadata OCI de un documento especifico, identificado por bucket y ruta. "
        "Valida que el bucket pertenezca al sistema y que la ruta no contenga path traversal."
    ),
    responses={
        200: {"description": "Metadata del documento"},
        400: {"description": "Bucket no permitido o ruta invalida"},
        401: {"description": "Token invalido o expirado"},
        403: {"description": "Acceso denegado — requiere MEDICO o ADMIN"},
        404: {"description": "Documento no encontrado en OCI"},
        429: {"description": "Limite de solicitudes excedido (30/min)"},
    },
)
@limiter.limit("30/minute")
async def obtener_documento(
    request: Request,
    bucket: str, ruta_objeto: str,
    usuario: TokenPayload = Depends(requiere_rol(Rol.MEDICO, Rol.ADMIN)),
    settings: Settings = Depends(get_settings),
    storage: MediFlowStorage = Depends(get_storage),
):
    buckets_validos = {settings.bucket_recibidos, settings.bucket_procesados, settings.bucket_auditoria}
    if bucket not in buckets_validos:
        raise HTTPException(status_code=400, detail="Bucket no permitido")

    if ".." in ruta_objeto or ruta_objeto.startswith("/"):
        raise HTTPException(status_code=400, detail="Ruta no permitida")

    try:
        _, metadata = storage.obtener_documento(bucket, ruta_objeto)
        return {"bucket": bucket, "ruta": ruta_objeto, "metadata": metadata}
    except DocumentoNoEncontradoError as e:
        raise HTTPException(status_code=404, detail=e.mensaje)
