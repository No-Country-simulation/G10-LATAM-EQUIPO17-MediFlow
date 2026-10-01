import logging

logger = logging.getLogger("mediflow.agent")

from langchain_google_genai import ChatGoogleGenerativeAI
from fastapi import HTTPException, status
import pymupdf as fitz
import base64
from src.core.config import get_settings
from src.services.oci_storage import MediFlowStorage

from src.schemas.agent_schemas import (
    SalidaAgenteExtractor,
    StatusTriaje,
    ContenidoImagen,
)
from src.schemas.documento import (
    MetadataDocumento, 
    DecisionEnrutamiento,
    AlmacenamientoOCI,
    RespuestaTriaje,
)

from src.core.prompts import(
    system_prompt_triaje,
    system_prompt_vision,
    system_prompt_enrutador,
)

settings = get_settings()

umbral_confianza_minimo = settings.umbral_confianza_minimo

medi_flow_storage = MediFlowStorage(settings=settings)


#--------------------------- Logica ------------------------------------

# LLM

llm_gemini= ChatGoogleGenerativeAI(
    model=settings.llm_provider,
    google_api_key=settings.llm_api_key,
    temperature=0.0,
)

agente_vision = system_prompt_vision | llm_gemini.with_structured_output(ContenidoImagen)

agente_triaje  = system_prompt_triaje | llm_gemini.with_structured_output(SalidaAgenteExtractor)

agente_enrutador = system_prompt_enrutador | llm_gemini.with_structured_output(DecisionEnrutamiento)

# --------

extensiones = settings.extensiones_archivos


# Funciones / Nodos

def get_es_texto(state:StatusTriaje) -> bool:
    return state["es_texto"]

def leer_imagen(imagen: str) -> str:
    try:
        resultado = agente_vision.invoke({"imagen": imagen})

        return resultado.contenido
    except Exception as e:
        logger.error(f"Error al procesar la imagen del documento: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la imagen del documento",
        )


def extraer_texto_multiformato(state: StatusTriaje) -> dict:

    nombre_archivo = state["nombre_archivo"]
    archivo_bytes = state["archivo_bytes"]
    solicitud = state["solicitud"]

    if not nombre_archivo or "." not in nombre_archivo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del archivo no es válido o carece de extensión."
        )

    file_ext = nombre_archivo.split(".")[-1].lower()
    if file_ext not in extensiones:
        logger.error(f"Extensión de archivo no permitida: .{file_ext}. Formatos soportados: {', '.join(extensiones)}")  
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión .{file_ext} no permitida. Formatos soportados: {', '.join(extensiones)}"
        )

    
    doc = None
    texto_total = []

    try:
        doc = fitz.open(stream=archivo_bytes, filetype=file_ext)

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()

            if text:
                texto_total.append(f"| Pagina {page_num + 1}: {text} |")
            else:
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                image = base64.b64encode(img_bytes).decode("utf-8")
                image_clean = image.replace("\n", "").replace("\r", "").strip()
                texto_imagen = leer_imagen(image_clean)
                texto_total.append(f"| Pagina {page_num + 1}: {texto_imagen} |")

        documento_texto = "\n\n".join(texto_total) if texto_total else "No se pudo extraer texto del archivo"

        solicitud.documento_texto = documento_texto

        return {"solicitud": solicitud}

    except HTTPException:
        logger.error(f"Error HTTPException al procesar el archivo {nombre_archivo}")
        raise
    except Exception as e:
        logger.error(f"Error inesperado al procesar el archivo {nombre_archivo}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar el archivo: {str(e)}"
        )
    finally:
        if doc:
            doc.close()


def extraer_datos_triaje(state: StatusTriaje) -> dict:

    solicitud = state["solicitud"]

    try:
        informacion_extraida = agente_triaje.invoke({
            "canal_origen": solicitud.canal_origen,
            "tipo_archivo": solicitud.tipo_archivo,
            "documento_texto": solicitud.documento_texto,
        })
    except Exception as e:
        logger.error(f"Error al invocar el agente de triaje para {solicitud.documento_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el triaje del documento",
        )

    return {
        "clasificacion": informacion_extraida.clasificacion,
        "datos_extraidos": informacion_extraida.datos_extraidos,
    }


def enrutar_triaje(state: StatusTriaje)-> dict:

    solicitud = state["solicitud"]
    clasificacion = state["clasificacion"]
    datos_extraidos = state["datos_extraidos"]
    archivo_bytes = state["archivo_bytes"]
    nombre_archivo = state["nombre_archivo"]
    es_texto = state["es_texto"]

    try:

        decision_enrutamiento = agente_enrutador.invoke({
            "umbral_confianza": umbral_confianza_minimo,
            "clasificacion": clasificacion,
            "datos_extraidos": datos_extraidos
        })

        metadata = MetadataDocumento.from_triaje_to_metadata(
            solicitud=solicitud,
            clasificacion=clasificacion,
            datos=datos_extraidos,
            decision=decision_enrutamiento
        )

        if not es_texto:

            respuesta_subida = medi_flow_storage.subir_documento(
                contenido=archivo_bytes, 
                metadata=metadata,
                nombre_archivo=nombre_archivo
            )

            if respuesta_subida.exito:
                logger.info(f"Documento {respuesta_subida.documento_id} subido exitosamente a OCI: {respuesta_subida.bucket}/{respuesta_subida.ruta_objeto}")
            else:
                logger.error(f"Error al subir el documento {nombre_archivo} a OCI")


        respuesta_triaje_dict = {
            "documento_id":solicitud.documento_id,
            "clasificacion":clasificacion.model_dump(mode="json"),
            "datos_extraidos":datos_extraidos.model_dump(mode="json"),
            "decision_enrutamiento":decision_enrutamiento.model_dump(mode="json"),
        }

        respuesta_triaje = medi_flow_storage.subir_resultado_triaje(
            documento_id=respuesta_triaje_dict["documento_id"],
            resultado_json=respuesta_triaje_dict,
            metadata=metadata
        )

        almacenamiento_oci = AlmacenamientoOCI(
            bucket=respuesta_triaje.bucket,
            ruta_objeto=respuesta_triaje.ruta_objeto
        )

        return {
        "decision_enrutamiento": decision_enrutamiento,
        "almacenamiento_oci": almacenamiento_oci
        }

    except Exception as e:
        logger.error(f"Error durante el procesamiento del agente de enrutamiento para {solicitud.documento_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error al procesar el triaje con la Inteligencia Artificial: {str(e)}"
        )



