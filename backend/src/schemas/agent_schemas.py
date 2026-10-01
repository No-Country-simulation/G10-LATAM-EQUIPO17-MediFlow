from typing import TypedDict
from pydantic import BaseModel, Field
from src.schemas.documento import (
    SolicitudTriaje,
    ClasificacionDocumento,
    DatosExtraidos,
    DecisionEnrutamiento,
    AlmacenamientoOCI,
)


#------     INICIO DE LOS SCHEMAS ------------

class StatusTriaje(TypedDict, total=False):
    solicitud: SolicitudTriaje
    archivo_bytes: bytes | None
    nombre_archivo: str | None
    clasificacion: ClasificacionDocumento | None 
    datos_extraidos: DatosExtraidos | None 
    decision_enrutamiento: DecisionEnrutamiento | None 
    almacenamiento_oci: AlmacenamientoOCI | None 
    es_texto: bool

class SalidaAgenteExtractor(BaseModel):
    clasificacion: ClasificacionDocumento = Field(
        ..., description="Clasificación, tipo de documento y score de confianza"
    )
    datos_extraidos: DatosExtraidos = Field(
    )

# SCHEMA PARA EXTRAER EL TEXTO DE IMAGENES
class ContenidoImagen(BaseModel):
    contenido: str = Field(
        description="Contenido extraído de las imágenes"
    )
