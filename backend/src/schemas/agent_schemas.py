from typing import TypedDict
from pydantic import BaseModel, Field
from fastapi import UploadFile
from src.schemas.documento import (
    SolicitudTriaje,
    ClasificacionDocumento,
    DatosExtraidos,
    DecisionEnrutamiento,
    AlmacenamientoOCI,
)


<<<<<<< HEAD
#------     INICIO DE LOS SCHEMAS ------------

class StatusTriaje(TypedDict, total=False):
    solicitud: SolicitudTriaje
    archivo_bytes: bytes | None
    nombre_archivo: str | None
    clasificacion: ClasificacionDocumento | None 
    datos_extraidos: DatosExtraidos | None 
    decision_enrutamiento: DecisionEnrutamiento | None 
    almacenamiento_oci: AlmacenamientoOCI | None 
=======
class StatusTriaje(TypedDict):
    solicitud: SolicitudTriaje
    clasificacion: ClasificacionDocumento | None
    datos_extraidos: DatosExtraidos | None
    decision_enrutamiento: DecisionEnrutamiento | None
    almacenamiento_oci: AlmacenamientoOCI | None

>>>>>>> f30fb145709559bc7bce7db31bf9ea693f271882

class SalidaAgenteExtractor(BaseModel):
    clasificacion: ClasificacionDocumento = Field(
        ..., description="Clasificacion, tipo de documento y score de confianza"
    )
    datos_extraidos: DatosExtraidos = Field(
<<<<<<< HEAD
=======
        ..., description="Datos clinicos y administrativos extraidos del texto"
>>>>>>> f30fb145709559bc7bce7db31bf9ea693f271882
    )


class ContenidoImagen(BaseModel):
    contenido: str = Field(
        description="Contenido extraido de las imagenes"
    )
