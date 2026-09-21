from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


# --- Enums ---

class EstadoDocumento(str, Enum):
    RECIBIDO = "recibido"
    PROCESADO = "procesado"
    AUDITORIA = "auditoria_humana"


class NivelPrioridad(str, Enum):
    RUTINA = "rutina"
    URGENTE = "urgente"
    EMERGENCIA = "emergencia"


class TipoDocumento(str, Enum):
    RECETA_MEDICA = "Receta Medica"
    INFORME_IMAGENES = "Informe de Estudio por Imagenes"
    INFORME_LABORATORIO = "Informe de Laboratorio"
    ORDEN_PROCEDIMIENTO = "Orden de Solicitud de Procedimiento"
    EPICRISIS = "Epicrisis / Informe de Alta"
    CERTIFICADO_MEDICO = "Certificado Medico"
    DESCONOCIDO = "Desconocido"


# --- Entrada (request /triaje) ---

class SolicitudTriaje(BaseModel):
    documento_id: str = Field(..., examples=["DOC-CLIN-2026-8942"])
    tipo_archivo: str = Field(..., examples=["PDF", "imagen", "texto"])
    documento_texto: str | None = None
    canal_origen: str = Field(default="manual", examples=["Guardia_Emergencias", "Consulta_Externa"])


# --- Salida (response /triaje) ---

class DatosPaciente(BaseModel):
    nombre: str = ""
    edad: int | None = None


class DatosMedico(BaseModel):
    nombre: str = ""
    matricula: str | None = None


class DatosExtraidos(BaseModel):
    paciente: DatosPaciente = Field(default_factory=DatosPaciente)
    medico_solicitante: DatosMedico = Field(default_factory=DatosMedico)
    estudio_realizado: str | None = None
    diagnostico_principal: str | None = None
    cie10_sugerido: str | None = None
    medicamentos: list[str] | None = None
    dosis: list[str] | None = None


class ClasificacionDocumento(BaseModel):
    tipo_documento: TipoDocumento
    especialidad: str = ""
    nivel_prioridad: NivelPrioridad
    score_confianza_clasificacion: float = Field(ge=0.0, le=1.0)


class NotificacionGenerada(BaseModel):
    canal: str
    mensaje: str


class DecisionEnrutamiento(BaseModel):
    destino_principal: str = Field(
        ...,
        examples=["Cola_Emergencia_Medica", "Farmacia_Hospitalaria",
                   "Auditoria_Autorizaciones", "Historia_Clinica_Electronica",
                   "Cola_Revision_Humana"],
    )
    requiere_auditoria_humana: bool = False
    justificacion_enrutamiento: str = ""
    notificacion_generada: NotificacionGenerada | None = None


class AlmacenamientoOCI(BaseModel):
    bucket: str
    ruta_objeto: str
    status_backup: str = "exito"


class RespuestaTriaje(BaseModel):
    status: str = "procesado"
    documento_id: str
    clasificacion: ClasificacionDocumento
    datos_extraidos: DatosExtraidos
    decision_enrutamiento: DecisionEnrutamiento
    almacenamiento_oci: AlmacenamientoOCI


# --- Metadata OCI ---

class MetadataDocumento(BaseModel):
    documento_id: str
    tipo_documento: TipoDocumento = TipoDocumento.DESCONOCIDO
    nivel_prioridad: NivelPrioridad = NivelPrioridad.RUTINA
    score_confianza: float = Field(default=0.0, ge=0.0, le=1.0)
    canal_origen: str = "manual"
    paciente_nombre: str | None = None
    medico_solicitante: str | None = None
    diagnostico_principal: str | None = None
    cie10: str | None = None
    fecha_recepcion: datetime = Field(default_factory=datetime.utcnow)
    destino_enrutamiento: str | None = None

    def to_oci_metadata(self) -> dict[str, str]:
        return {
            "documento_id": self.documento_id,
            "tipo_documento": self.tipo_documento.value,
            "nivel_prioridad": self.nivel_prioridad.value,
            "score_confianza": str(self.score_confianza),
            "canal_origen": self.canal_origen,
            "paciente_nombre": self.paciente_nombre or "",
            "medico_solicitante": self.medico_solicitante or "",
            "diagnostico_principal": self.diagnostico_principal or "",
            "cie10": self.cie10 or "",
            "fecha_recepcion": self.fecha_recepcion.isoformat(),
            "destino_enrutamiento": self.destino_enrutamiento or "",
        }


# --- Respuestas storage ---

class ResultadoSubida(BaseModel):
    exito: bool
    documento_id: str
    bucket: str
    ruta_objeto: str
    estado: EstadoDocumento
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    mensaje: str = ""


class ResultadoMovimiento(BaseModel):
    exito: bool
    documento_id: str
    bucket_origen: str
    bucket_destino: str
    ruta_origen: str
    ruta_destino: str
    estado_nuevo: EstadoDocumento
    timestamp: datetime = Field(default_factory=datetime.utcnow)
