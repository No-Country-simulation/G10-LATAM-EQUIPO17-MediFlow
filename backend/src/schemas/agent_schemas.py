from typing import TypedDict, Optional
from pydantic import BaseModel, Field
from src.schemas.documento import (
    SolicitudTriaje,
    ClasificacionDocumento,
    DatosExtraidos,
    DecisionEnrutamiento,
    AlmacenamientoOCI,
)


#------     INICIO DE LOS SCHEMAS ------------

class StatusTriaje(TypedDict):
    solicitud: SolicitudTriaje
    clasificacion: Optional[ClasificacionDocumento]
    datos_extraidos: Optional[DatosExtraidos]
    decision_enrutamiento: Optional[DecisionEnrutamiento]
    almacenamiento_oci: Optional[AlmacenamientoOCI]

class SalidaAgenteExtractor(BaseModel):
    clasificacion: ClasificacionDocumento = Field(
        ..., description="Clasificación, tipo de documento y score de confianza"
    )
    datos_extraidos: DatosExtraidos = Field(
        ..., description="Datos clínicos y administrativos extraídos del texto"
    )

# SCHEMA PARA EXTRAER EL TEXTO DE IMAGENES
class ContenidoImagen(BaseModel):
    contenido: str = Field(
        description="Contenido extraído de las imágenes"
    )
