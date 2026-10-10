from typing import TypedDict
from pydantic import BaseModel, Field
from src.repository.registro_triaje_repository import RegistroTriajeRepository
from src.schemas.documento import (
    SolicitudTriaje,
    ClasificacionDocumento,
    DatosExtraidos,
    DecisionEnrutamiento,
    AlmacenamientoOCI,
)


class StatusTriaje(TypedDict, total=False):
    solicitud: SolicitudTriaje
    es_texto: bool
    usuario_id: str 
    repositorio_triaje: RegistroTriajeRepository
    archivo_bytes: bytes | None
    nombre_archivo: str | None
    clasificacion: ClasificacionDocumento | None 
    datos_extraidos: DatosExtraidos | None 
    decision_enrutamiento: DecisionEnrutamiento | None 
    almacenamiento_oci: AlmacenamientoOCI | None 

class SalidaAgenteExtractor(BaseModel):
    clasificacion: ClasificacionDocumento = Field(
        ..., description="Clasificación, tipo de documento y score de confianza"
    )
    datos_extraidos: DatosExtraidos = Field(
    )

class ContenidoImagen(BaseModel):
    contenido: str = Field(
        description="Contenido extraído de las imágenes"
    )
