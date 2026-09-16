class MediFlowError(Exception):
    def __init__(self, mensaje: str, codigo: str | None = None):
        self.mensaje = mensaje
        self.codigo = codigo
        super().__init__(self.mensaje)


# --- Storage (OCI) ---

class MediFlowStorageError(MediFlowError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        self.documento_id = documento_id
        super().__init__(mensaje, codigo="STORAGE_ERROR")


class DocumentoNoEncontradoError(MediFlowStorageError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        super().__init__(mensaje, documento_id)
        self.codigo = "DOCUMENTO_NO_ENCONTRADO"


class SubidaFallidaError(MediFlowStorageError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        super().__init__(mensaje, documento_id)
        self.codigo = "SUBIDA_FALLIDA"


class BucketNoEncontradoError(MediFlowStorageError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        super().__init__(mensaje, documento_id)
        self.codigo = "BUCKET_NO_ENCONTRADO"


class ConfiguracionOCIError(MediFlowStorageError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        super().__init__(mensaje, documento_id)
        self.codigo = "CONFIG_OCI_ERROR"


# --- Triaje ---

class TriajeError(MediFlowError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        self.documento_id = documento_id
        super().__init__(mensaje, codigo="TRIAJE_ERROR")


class ClasificacionError(TriajeError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        super().__init__(mensaje, documento_id)
        self.codigo = "CLASIFICACION_ERROR"


class ExtraccionError(TriajeError):
    def __init__(self, mensaje: str, documento_id: str | None = None):
        super().__init__(mensaje, documento_id)
        self.codigo = "EXTRACCION_ERROR"
