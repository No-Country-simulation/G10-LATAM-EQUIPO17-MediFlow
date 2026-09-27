from typing import TypedDict
from pydantic import BaseModel, Field
from src.schemas.documento import (
    SolicitudTriaje,
    ClasificacionDocumento,
    DatosExtraidos,
    DecisionEnrutamiento,
    AlmacenamientoOCI,
)


class StatusTriaje(TypedDict):
    solicitud: SolicitudTriaje
    clasificacion: ClasificacionDocumento | None
    datos_extraidos: DatosExtraidos | None
    decision_enrutamiento: DecisionEnrutamiento | None
    almacenamiento_oci: AlmacenamientoOCI | None


class SalidaAgenteExtractor(BaseModel):
    clasificacion: ClasificacionDocumento = Field(
        ..., description="Clasificacion, tipo de documento y score de confianza"
    )
    datos_extraidos: DatosExtraidos = Field(
        ..., description="Datos clinicos y administrativos extraidos del texto"
    )


class ContenidoImagen(BaseModel):
    contenido: str = Field(
        description="Contenido extraido de las imagenes"
    )
