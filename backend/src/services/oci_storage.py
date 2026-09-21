import json
import logging
from datetime import datetime

import oci

from src.core.config import Settings
from src.core.exceptions import (
    BucketNoEncontradoError, ConfiguracionOCIError,
    DocumentoNoEncontradoError, SubidaFallidaError,
)
from src.schemas.documento import (
    EstadoDocumento, MetadataDocumento, NivelPrioridad,
    ResultadoMovimiento, ResultadoSubida,
)

logger = logging.getLogger("mediflow.storage")


class MediFlowStorage:

    def __init__(self, settings: Settings):
        self.settings = settings
        self._client = self._crear_cliente()
        logger.info("Storage conectado — %s (%s)", settings.oci_region, settings.oci_namespace)

    def _crear_cliente(self) -> oci.object_storage.ObjectStorageClient:
        try:
            config = self.settings.obtener_oci_config()
            oci.config.validate_config(config)
            return oci.object_storage.ObjectStorageClient(config)
        except Exception as e:
            raise ConfiguracionOCIError(f"Error conectando a OCI: {e}")

    # --- Subida ---

    def subir_documento(self, contenido: bytes, metadata: MetadataDocumento,
                        nombre_archivo: str | None = None) -> ResultadoSubida:
        bucket = self.settings.bucket_recibidos
        ruta = self._construir_ruta(metadata.documento_id, nombre_archivo)

        try:
            self._client.put_object(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket,
                object_name=ruta,
                put_object_body=contenido,
                opc_meta=metadata.to_oci_metadata(),
                content_type=self._detectar_content_type(nombre_archivo),
            )
            logger.info("Documento %s → %s/%s", metadata.documento_id, bucket, ruta)
            return ResultadoSubida(
                exito=True, documento_id=metadata.documento_id,
                bucket=bucket, ruta_objeto=ruta,
                estado=EstadoDocumento.RECIBIDO,
                mensaje=f"Documento recibido en {bucket}/{ruta}",
            )
        except oci.exceptions.ServiceError as e:
            logger.error("Error subiendo %s: %s", metadata.documento_id, e.message)
            raise SubidaFallidaError(f"OCI rechazó la subida: {e.message}",
                                     documento_id=metadata.documento_id)

    def subir_resultado_triaje(self, documento_id: str, resultado_json: dict,
                                metadata: MetadataDocumento) -> ResultadoSubida:
        requiere_auditoria = metadata.score_confianza < self.settings.umbral_confianza_minimo

        if requiere_auditoria:
            estado = EstadoDocumento.AUDITORIA
            bucket = self.settings.bucket_auditoria
            subcarpeta = "baja_confianza"
        else:
            estado = EstadoDocumento.PROCESADO
            bucket = self.settings.bucket_procesados
            subcarpeta = ("urgentes"
                          if metadata.nivel_prioridad in (NivelPrioridad.URGENTE, NivelPrioridad.EMERGENCIA)
                          else "rutina")

        ruta = f"{subcarpeta}/{documento_id}.json"
        contenido = json.dumps(resultado_json, ensure_ascii=False, indent=2).encode("utf-8")

        try:
            self._client.put_object(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket,
                object_name=ruta,
                put_object_body=contenido,
                opc_meta=metadata.to_oci_metadata(),
                content_type="application/json",
            )
            logger.info("Triaje %s → %s/%s (score: %.2f)", documento_id, bucket, ruta, metadata.score_confianza)
            return ResultadoSubida(
                exito=True, documento_id=documento_id,
                bucket=bucket, ruta_objeto=ruta, estado=estado,
                mensaje=(f"Derivado a auditoría (score: {metadata.score_confianza:.2f})"
                         if requiere_auditoria else f"Procesado → {bucket}/{ruta}"),
            )
        except oci.exceptions.ServiceError as e:
            raise SubidaFallidaError(f"Error guardando triaje: {e.message}", documento_id=documento_id)

    # --- Mover entre buckets ---

    def mover_documento(self, documento_id: str, ruta_objeto: str,
                        bucket_origen: str, estado_destino: EstadoDocumento) -> ResultadoMovimiento:
        bucket_destino = self.settings.get_bucket_por_estado(estado_destino.value)

        try:
            response = self._client.get_object(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket_origen, object_name=ruta_objeto,
            )
            self._client.put_object(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket_destino, object_name=ruta_objeto,
                put_object_body=response.data.content,
                content_type=response.headers.get("content-type", "application/octet-stream"),
            )
            self._client.delete_object(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket_origen, object_name=ruta_objeto,
            )
            logger.info("Movido %s: %s → %s", documento_id, bucket_origen, bucket_destino)
            return ResultadoMovimiento(
                exito=True, documento_id=documento_id,
                bucket_origen=bucket_origen, bucket_destino=bucket_destino,
                ruta_origen=ruta_objeto, ruta_destino=ruta_objeto,
                estado_nuevo=estado_destino,
            )
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                raise DocumentoNoEncontradoError(
                    f"No encontrado: {bucket_origen}/{ruta_objeto}", documento_id=documento_id)
            raise SubidaFallidaError(f"Error moviendo: {e.message}", documento_id=documento_id)

    # --- Lectura ---

    def obtener_documento(self, bucket: str, ruta_objeto: str) -> tuple[bytes, dict]:
        try:
            response = self._client.get_object(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket, object_name=ruta_objeto,
            )
            metadata = {k.replace("opc-meta-", ""): v
                        for k, v in response.headers.items() if k.startswith("opc-meta-")}
            return response.data.content, metadata
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                raise DocumentoNoEncontradoError(f"No existe: {bucket}/{ruta_objeto}")
            raise

    def listar_documentos(self, estado: EstadoDocumento,
                          prefijo: str | None = None, limite: int = 100) -> list[dict]:
        bucket = self.settings.get_bucket_por_estado(estado.value)
        try:
            response = self._client.list_objects(
                namespace_name=self.settings.oci_namespace,
                bucket_name=bucket, prefix=prefijo, limit=limite,
            )
            return [{"nombre": obj.name, "tamaño_bytes": obj.size,
                      "creado": obj.time_created.isoformat() if obj.time_created else None}
                    for obj in response.data.objects]
        except oci.exceptions.ServiceError as e:
            if e.status == 404:
                raise BucketNoEncontradoError(f"Bucket '{bucket}' no existe. ¿Lo creaste en OCI?")
            raise

    # --- Health check ---

    def verificar_conexion(self) -> dict:
        resultados = {}
        for bucket in [self.settings.bucket_recibidos, self.settings.bucket_procesados, self.settings.bucket_auditoria]:
            try:
                self._client.get_bucket(namespace_name=self.settings.oci_namespace, bucket_name=bucket)
                resultados[bucket] = "ok"
            except oci.exceptions.ServiceError:
                resultados[bucket] = "no_encontrado"

        return {
            "oci_conectado": all(v == "ok" for v in resultados.values()),
            "namespace": self.settings.oci_namespace,
            "region": self.settings.oci_region,
            "buckets": resultados,
        }

    # --- Utils ---

    @staticmethod
    def _construir_ruta(documento_id: str, nombre_archivo: str | None = None) -> str:
        hoy = datetime.utcnow()
        nombre = nombre_archivo or f"{documento_id}.bin"
        return f"{hoy:%Y/%m/%d}/{nombre}"

    @staticmethod
    def _detectar_content_type(nombre_archivo: str | None) -> str:
        if not nombre_archivo:
            return "application/octet-stream"
        ext_map = {".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg",
                   ".jpeg": "image/jpeg", ".json": "application/json", ".txt": "text/plain"}
        for ext, ct in ext_map.items():
            if nombre_archivo.lower().endswith(ext):
                return ct
        return "application/octet-stream"
