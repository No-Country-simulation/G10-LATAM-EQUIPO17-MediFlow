from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MediFlow"
    app_version: str = "0.1.0"
    debug: bool = False

    # OCI
    oci_config_path: str = "~/.oci/config"
    oci_config_profile: str = "DEFAULT"
    oci_namespace: str = Field(...)
    oci_compartment_id: str = Field(...)
    oci_region: str = "sa-saopaulo-1"

    # Buckets
    bucket_recibidos: str = "mediflow-recibidos"
    bucket_procesados: str = "mediflow-procesados"
    bucket_auditoria: str = "mediflow-auditoria"

    # Umbral para derivar a auditoría humana
    umbral_confianza_minimo: float = Field(default=0.75, ge=0.0, le=1.0)

    # LLM
    llm_provider: str = "gemini"
    llm_api_key: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }

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
