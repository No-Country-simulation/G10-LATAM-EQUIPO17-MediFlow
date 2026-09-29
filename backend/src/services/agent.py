from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from fastapi import UploadFile, HTTPException, status
import pymupdf as fitz
import base64

from src.schemas.documento import SolicitudTriaje
from src.core.config import get_settings
from src.services.oci_storage import MediFlowStorage

from src.schemas.agent_schemas import (
    SalidaAgenteExtractor,
    StatusTriaje,
    ContenidoImagen,
)
from src.core.prompts import (
    MetadataDocumento, 
    SolicitudTriaje,
    DecisionEnrutamiento,
    AlmacenamientoOCI,
    RespuestaTriaje,
)

from src.core.prompts import(
    system_prompt_triaje,
    system_prompt_vision,
    syetem_prompt_enrutador,
)

settings = get_settings()

umbral_confianza_minimo = settings.umbral_confianza_minimo


#--------------------------- Logica ------------------------------------

# LLM

llm_gemini = ChatGoogleGenerativeAI(
    model=settings.llm_provider,
    google_api_key=settings.llm_api_key,
    temperature=0.0,
)

llm_groq = ChatGroq(
    model_name=settings.model_groq,
    groq_api_key=settings.api_key_groq,
    temperature=0.0,
)

agente_vision = system_prompt_vision | llm_gemini.with_structured_output(ContenidoImagen)

agente_triaje  = system_prompt_triaje | llm_gemini.with_structured_output(SalidaAgenteExtractor)

agente_enrutador = syetem_prompt_enrutador | llm_gemini.with_structured_output(DecisionEnrutamiento)

# --------

extensiones = settings.extensiones_archivos


# Funciones / Nodos

def leer_imagene(imagen: str) -> str:
    try:
        resultado = agente_vision.invoke({"imagen": imagen})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la imagen del documento",
        )
    return resultado.contenido


async def extraer_texto_multiformato(file: UploadFile) -> str:
    if not file.filename or "." not in file.filename:
        return "Archivo no valido"

    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in extensiones:
        return "Archivo no valido"

    file_bytes = await file.read()
    doc = None
    texto_total = []

    try:
        doc = fitz.open(stream=file_bytes, filetype=file_ext)

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
                texto_imagen = leer_imagene(image_clean)
                texto_total.append(f"| Pagina {page_num + 1}: {texto_imagen} |")

        return "\n\n".join(texto_total) if texto_total else "No se pudo extraer texto del archivo"

    except HTTPException:
        raise
    except Exception:
        return "Error al procesar el archivo"
    finally:
        if doc:
            doc.close()


def extraer_datos_triaje(status: StatusTriaje) -> dict:

    solicitud_agent = status["solicitud"]

    try:
        informacion_extraida = agente_triaje.invoke({
            "canal_origen": solicitud_agent.canal_origen,
            "tipo_archivo": solicitud_agent.tipo_archivo,
            "documento_texto": solicitud_agent.documento_texto,
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar el triaje del documento",
        )

    return {
        "clasificacion": informacion_extraida.clasificacion,
        "datos_extraidos": informacion_extraida.datos_extraidos,
    }


def enrutar_triaje(status: StatusTriaje)-> dict:

    try:

        decision_enrutamiento = agente_enrutador.invoke({
            "umbral_confianza": umbral_confianza_minimo,
            "clasificacion": status["clasificacion"],
            "datos_extraidos": status["datos_extraidos"]
        })

    except Exception as e:
        print(f"Error durante el procesamiento del agente: {e}")
    
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error al procesar el triaje con la Inteligencia Artificial: {str(e)}"
        )


    return {"decision_enrutamiento": decision_enrutamiento}


    
   
