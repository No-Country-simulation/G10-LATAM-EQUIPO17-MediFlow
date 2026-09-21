import os
import base64
import tempfile
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MediFlow"
    app_version: str = "0.1.0"
    debug: bool = False

    # OCI (modo local: archivo .pem)
    oci_config_path: str = "~/.oci/config"
    oci_config_profile: str = "DEFAULT"
    oci_namespace: str = Field(...)
    oci_compartment_id: str = Field(...)
    oci_region: str = "sa-saopaulo-1"

    # OCI (modo producción: credenciales por variables de entorno)
    oci_user: str = ""
    oci_fingerprint: str = ""
    oci_tenancy: str = ""
    oci_private_key_base64: str = ""

    # Buckets
    bucket_recibidos: str = "mediflow-recibidos"
    bucket_procesados: str = "mediflow-procesados"
    bucket_auditoria: str = "mediflow-auditoria"

    # Umbral para derivar a auditoría humana
    umbral_confianza_minimo: float = Field(default=0.75, ge=0.0, le=1.0)

    # LLM
    llm_provider: str = "gemini"
    llm_api_key: str = ""

    # JWT
    jwt_secret_key: str = "mediflow-dev-secret-cambiar-en-prod"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    @property
    def es_produccion(self) -> bool:
        return bool(self.oci_private_key_base64 and self.oci_user and self.oci_tenancy)

    def obtener_oci_config(self) -> dict:
        if self.es_produccion:
            key_bytes = base64.b64decode(self.oci_private_key_base64)
            key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
            key_file.write(key_bytes)
            key_file.close()
            os.chmod(key_file.name, 0o600)

            return {
                "user": self.oci_user,
                "fingerprint": self.oci_fingerprint,
                "tenancy": self.oci_tenancy,
                "region": self.oci_region,
                "key_file": key_file.name,
            }
        else:
            import oci
            return oci.config.from_file(
                file_location=self.oci_config_path,
                profile_name=self.oci_config_profile,
            )

    def get_bucket_por_estado(self, estado: str) -> str:
        mapa = {
            "recibido": self.bucket_recibidos,
            "procesado": self.bucket_procesados,
            "auditoria_humana": self.bucket_auditoria,
        }
        bucket = mapa.get(estado)
        if not bucket:
            raise ValueError(f"Estado '{estado}' no válido. Opciones: {list(mapa.keys())}")
        return bucket


@lru_cache
def get_settings() -> Settings:
    return Settings()
