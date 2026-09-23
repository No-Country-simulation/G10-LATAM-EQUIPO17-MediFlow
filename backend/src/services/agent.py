from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from fastapi import UploadFile, FastAPI
import pymupdf as fitz
import base64

from src.core.config import get_settings

from src.schemas.agent_schemas import (
    SalidaAgenteExtractor,
    StatusTriaje,
    ContenidoImagen,
)

from src.core.prompts import(
    system_prompt_extrator,
    system_prompt_vision,
)

settings = get_settings()


#--------------------------- Logica ------------------------------------

# LLM

llm_gemini = ChatGoogleGenerativeAI(
    model=settings.llm_provider,
    google_api_key=settings.llm_api_key,
    temperature=0.0
)

llm_groq = ChatGroq(
    model_name=settings.model_groq,
    groq_api_key=settings.api_key_groq,
    temperature=0.0
)


# AGENTES

agente_vision = system_prompt_vision | llm_gemini.with_structured_output(ContenidoImagen)

agente_extrator = system_prompt_extrator | llm_gemini.with_structured_output(SalidaAgenteExtractor)

agente_enrutador = None

extensiones = settings.extensiones_archivos

def leer_imagene(imagen: str) -> str:

    try:
       resultado = agente_vision.invoke({"imagen": imagen})
    except Exception as e:
        if "429" in str(e):
            return "Lo siento, he alcanzado el límite de consultas por hoy. Por favor, inténtalo nuevamente cuando las cuotas se recuperen."

        print(f"Error generando respuesta: {e}")
        return "Hubo un problema con el servicio de IA. Inténtalo de nuevo en unos momentos."

    return resultado.contenido



async def extraer_texto_multiformato(file: UploadFile) -> str:
    """
    Extrae texto de un UploadFile (PDF estandar, PDF escaneado o imagen).
    """
    doc = None
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
                texto_total.append(f"| Página {page_num + 1}: {text} |")

            else:
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")

                image = base64.b64encode(img_bytes).decode("utf-8")
                image_clean = image.replace("\n", "").replace("\r", "").strip() 
                
                texto_imagen = leer_imagene(image_clean)
                texto_total.append(f"| Página {page_num + 1}: {texto_imagen} |")
                                

        return "\n\n".join(texto_total) if texto_total else "No se pudo extraer texto del archivo"
    
    except Exception as e:
        print(f"Error procesando documento: {e}")
        return "Error al procesar el archivo"
    finally:
        if doc:
            doc.close()
    

app = FastAPI()

@app.post("/archivo")
async def archivo(file: UploadFile):

    texto = await extraer_texto_multiformato(file)

    return {"texto extraido": texto}


