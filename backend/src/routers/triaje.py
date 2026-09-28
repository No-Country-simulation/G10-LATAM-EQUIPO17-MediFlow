from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form

from src.core.rate_limit import limiter
from src.schemas.documento import SolicitudTriaje, RespuestaTriaje
from src.security import requiere_rol, Rol
from src.security.schemas import TokenPayload

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
    raise HTTPException(
        status_code=501,
        detail={"mensaje": "Pipeline de triaje pendiente de implementación",
                "documento_id": solicitud.documento_id},
    )


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

    contenido = await archivo.read()
    if len(contenido) > MAX_ARCHIVO_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Archivo excede el limite de {MAX_ARCHIVO_BYTES // (1024 * 1024)} MB",
        )
    await archivo.seek(0)

    raise HTTPException(
        status_code=501,
        detail={"mensaje": "Pipeline de triaje con archivo pendiente",
                "documento_id": documento_id, "archivo": archivo.filename},
    )
