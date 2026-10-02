import logging

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form

from src.core.rate_limit import limiter
from src.schemas.documento import SolicitudTriaje, RespuestaTriaje
from src.security import requiere_rol, Rol
from src.security.schemas import TokenPayload
from src.services.graph import procesar_solicitud_triaje

logger = logging.getLogger("mediflow.triaje")

router = APIRouter(prefix="/triaje", tags=["Triaje Clínico"])

TIPOS_ARCHIVO_PERMITIDOS = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
MAX_ARCHIVO_BYTES = 10 * 1024 * 1024


@router.post("/", response_model=RespuestaTriaje)
@limiter.limit("30/minute")
async def procesar_triaje(
    request: Request,
    solicitud: SolicitudTriaje,
    usuario: TokenPayload = Depends(requiere_rol(Rol.MEDICO, Rol.ADMIN)),
):
    if not solicitud.documento_texto:
        raise HTTPException(status_code=400, detail="documento_texto es requerido para triaje de texto")

    try:
        return await procesar_solicitud_triaje(
            solicitud=solicitud,
            es_texto=True,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error en triaje texto %s: %s", solicitud.documento_id, str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno procesando el triaje")


@router.post("/archivo", response_model=RespuestaTriaje)
@limiter.limit("15/minute")
async def procesar_triaje_archivo(
    request: Request,
    archivo: UploadFile = File(...),
    documento_id: str = Form(...),
    canal_origen: str = Form(default="manual"),
    usuario: TokenPayload = Depends(requiere_rol(Rol.MEDICO, Rol.ADMIN)),
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
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error en triaje archivo %s: %s", documento_id, str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno procesando el archivo")
