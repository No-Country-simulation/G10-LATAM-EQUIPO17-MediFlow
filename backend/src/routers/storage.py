from fastapi import APIRouter, Depends, HTTPException, Query

from src.core.config import Settings, get_settings
from src.core.exceptions import BucketNoEncontradoError, ConfiguracionOCIError, DocumentoNoEncontradoError
from src.schemas.documento import EstadoDocumento
from src.services.oci_storage import MediFlowStorage

router = APIRouter(prefix="/storage", tags=["OCI Object Storage"])


def get_storage(settings: Settings = Depends(get_settings)) -> MediFlowStorage:
    return MediFlowStorage(settings)


@router.get("/health")
async def health_check(storage: MediFlowStorage = Depends(get_storage)):
    try:
        resultado = storage.verificar_conexion()
        if not resultado["oci_conectado"]:
            raise HTTPException(status_code=503, detail={"mensaje": "Buckets no disponibles", **resultado})
        return resultado
    except ConfiguracionOCIError as e:
        raise HTTPException(status_code=503, detail={"mensaje": e.mensaje, "codigo": e.codigo})


@router.get("/documentos")
async def listar_documentos(
    estado: EstadoDocumento = Query(...),
    prefijo: str | None = Query(default=None),
    limite: int = Query(default=50, ge=1, le=500),
    storage: MediFlowStorage = Depends(get_storage),
):
    try:
        return storage.listar_documentos(estado=estado, prefijo=prefijo, limite=limite)
    except BucketNoEncontradoError as e:
        raise HTTPException(status_code=404, detail=e.mensaje)


@router.get("/documentos/{bucket}/{ruta_objeto:path}")
async def obtener_documento(
    bucket: str, ruta_objeto: str,
    storage: MediFlowStorage = Depends(get_storage),
):
    try:
        _, metadata = storage.obtener_documento(bucket, ruta_objeto)
        return {"bucket": bucket, "ruta": ruta_objeto, "metadata": metadata}
    except DocumentoNoEncontradoError as e:
        raise HTTPException(status_code=404, detail=e.mensaje)
