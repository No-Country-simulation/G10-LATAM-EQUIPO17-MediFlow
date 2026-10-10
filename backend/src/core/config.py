import logging
import os
import base64
import tempfile
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings

logger = logging.getLogger("mediflow.config")

_oci_key_path: str | None = None


class Settings(BaseSettings):
    app_name: str = "MediFlow"
    app_version: str = "0.1.0"
    debug: bool = False

    # OCI (modo local: archivo .pem)
    oci_config_path: str = "~/.oci/config"
    oci_config_profile: str = "DEFAULT"
    oci_namespace: str = ""
    oci_compartment_id: str = ""
    oci_region: str = "sa-saopaulo-1"

    # OCI (modo produccion: credenciales por variables de entorno)
    oci_user: str = ""
    oci_fingerprint: str = ""
    oci_tenancy: str = ""
    oci_private_key_base64: str = ""

    # Buckets
    bucket_recibidos: str = "mediflow-recibidos"
    bucket_procesados: str = "mediflow-procesados"
    bucket_auditoria: str = "mediflow-auditoria"

    # Umbral para derivar a auditoria humana
    umbral_confianza_minimo: float = Field(default=0.75, ge=0.0, le=1.0)

    # DB
    database_url: str = "sqlite+aiosqlite:///./mediflow.db"

    # LLM
    llm_provider: str = "gemini-3.8-flash"
    llm_api_key: str = ""
    api_key_groq: str = ""
    model_groq: str = "llama-3.2-11b-vision-preview"

    # Extensiones de los archivos
    extensiones_archivos: set[str] = {"pdf", "png", "jpg", "jpeg"}

    # JWT
    jwt_secret_key: str = "mediflow-dev-secret-cambiar-en-prod"

    # CORS
    allowed_origins: str = "*"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

    @property
    def es_produccion(self) -> bool:
        return bool(self.oci_private_key_base64 and self.oci_user and self.oci_tenancy)

    def validar_produccion(self):
        if self.es_produccion and self.jwt_secret_key == "mediflow-dev-secret-cambiar-en-prod":
            raise RuntimeError("JWT_SECRET_KEY no puede usar el valor por defecto en produccion")
        if self.es_produccion and len(self.jwt_secret_key) < 32:
            raise RuntimeError("JWT_SECRET_KEY debe tener al menos 32 caracteres en produccion")
        if self.es_produccion and self.allowed_origins.strip() == "*":
            raise RuntimeError("ALLOWED_ORIGINS no puede ser '*' en produccion")

    def obtener_oci_config(self) -> dict:
        global _oci_key_path
        if self.es_produccion:
            if _oci_key_path is None or not os.path.exists(_oci_key_path):
                key_bytes = base64.b64decode(self.oci_private_key_base64)
                key_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pem")
                key_file.write(key_bytes)
                key_file.close()
                os.chmod(key_file.name, 0o600)
                _oci_key_path = key_file.name

            return {
                "user": self.oci_user,
                "fingerprint": self.oci_fingerprint,
                "tenancy": self.oci_tenancy,
                "region": self.oci_region,
                "key_file": _oci_key_path,
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
            raise ValueError(f"Estado '{estado}' no valido. Opciones: {list(mapa.keys())}")
        return bucket


@lru_cache
def get_settings() -> Settings:
    return Settings()
