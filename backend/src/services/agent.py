from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from fastapi import File, Form, UploadFile, HTTPException, status, FastAPI
import pymupdf as fitz
import base64
from src.schemas.documento import SolicitudTriaje
from src.core.config import get_settings

from src.schemas.agent_schemas import (
    SalidaAgenteExtractor,
    StatusTriaje,
    ContenidoImagen,
)

from src.core.prompts import(
    system_prompt_triaje,
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

agente_triaje  = system_prompt_triaje | llm_gemini.with_structured_output(SalidaAgenteExtractor)

agente_enrutador = None

extensiones = settings.extensiones_archivos

def leer_imagene(imagen: str) -> str:

    try:
       resultado = agente_vision.invoke({"imagen": imagen})
    except Exception as e:

        print(f"Error durante el procesamiento del agente: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error al procesar el triaje con la Inteligencia Artificial: {str(e)}"
        )

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

def extraer_datos_triaje(statu: StatusTriaje) -> dict:

    solicitud_agent = statu["solicitud"]

    try:
        informacion_extraida = agente_triaje .invoke({
            "canal_origen": solicitud_agent.canal_origen,
            "tipo_archivo": solicitud_agent.tipo_archivo,
            "documento_texto": solicitud_agent.documento_texto 
            })

    except Exception as e:
        print(f"Error durante el procesamiento del agente: {e}")
    
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error al procesar el triaje con la Inteligencia Artificial: {str(e)}"
        )

    return{
        "clasificacion": informacion_extraida.clasificacion,
        "datos_extraidos": informacion_extraida.datos_extraidos}


app = FastAPI()

@app.post("/archivo")
async def archivo(solicitud: SolicitudTriaje):

    datos= extraer_datos_triaje({"solicitud": solicitud})

    return {"datos extraido": datos}

@app.post("/archivo2")
async def procesar_triaje_archivo(
    archivo: UploadFile = File(...),
    documento_id: str = Form(...),
    canal_origen: str = Form(default="manual"),
):

    documento_texto = await extraer_texto_multiformato(archivo)

    solicitud = SolicitudTriaje(
        documento_id=documento_id,
        canal_origen=canal_origen,
        tipo_archivo=archivo.filename.split(".")[-1].lower() if archivo.filename else "archivo",
        documento_texto=documento_texto
    )

    datos = extraer_datos_triaje({"solicitud":solicitud})

    return datos

    
   
