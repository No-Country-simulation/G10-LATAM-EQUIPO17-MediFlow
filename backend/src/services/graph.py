from fastapi import FastAPI, File, Form, UploadFile
from langgraph.graph import StateGraph, START, END 
from langgraph.graph.state import CompiledStateGraph
from src.schemas.documento import SolicitudTriaje, RespuestaTriaje
from src.schemas.agent_schemas import StatusTriaje
from src.services.agent import (
    extraer_texto_multiformato,
    extraer_datos_triaje,
    enrutar_triaje,
    get_es_texto,
)

import os

_graph_instance: CompiledStateGraph | None = None


def create_graph():

    workflow = StateGraph(StatusTriaje)

    workflow.add_node("nodo_extrator_multiformato", extraer_texto_multiformato)
    workflow.add_node("nodo_extrator_triaje", extraer_datos_triaje)
    workflow.add_node("nodo_enrutador_triaje", enrutar_triaje)

    workflow.add_conditional_edges(
        START, 
        get_es_texto,
        {
        True: "nodo_extrator_triaje",
        False: "nodo_extrator_multiformato"
        })

    workflow.add_edge("nodo_extrator_multiformato", "nodo_extrator_triaje")
    workflow.add_edge("nodo_extrator_triaje", "nodo_enrutador_triaje")
    workflow.add_edge("nodo_enrutador_triaje", END)

    return workflow.compile()

def get_graph():

    global _graph_instance

    if _graph_instance is None:
        _graph_instance = create_graph()

    return _graph_instance


async def procesar_solicitud_triaje(
        solicitud: SolicitudTriaje,
        es_texto: bool,
        archivo_bytes: bytes | None = None,
        nombre_archivo: str | None = None,
)-> RespuestaTriaje:

    app = get_graph()

    respuesta = await app.ainvoke({
        "solicitud": solicitud,
        "archivo_bytes": archivo_bytes,
        "nombre_archivo": nombre_archivo,
        "es_texto": es_texto,
    })

    return RespuestaTriaje(
        documento_id=respuesta["solicitud"].documento_id,
        clasificacion=respuesta["clasificacion"],
        datos_extraidos=respuesta["datos_extraidos"],
        decision_enrutamiento=respuesta["decision_enrutamiento"],
        almacenamiento_oci=respuesta["almacenamiento_oci"]
    )

def generar_visualizacion(graph):

    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        assets_dir = os.path.join(base_dir, "assets")
        
        os.makedirs(assets_dir, exist_ok=True)
        
        ruta_guardado = os.path.join(assets_dir, "grafo_flujo.png")
        
        png_data = graph.get_graph().draw_mermaid_png()
        with open(ruta_guardado, "wb") as f:
            f.write(png_data)
            
        print(f"Imagen del grafo generada correctamente en: {ruta_guardado}")
    except Exception as e:
        print(f"Error al generar la imagen: {e}")



app = FastAPI()

@app.post("/archivo")
async def archivo(solicitud: SolicitudTriaje):

    respuesta = await procesar_solicitud_triaje(
        solicitud=solicitud,
        es_texto=True
    )

    return respuesta


@app.post("/archivo2")
async def procesar_triaje_archivo(
    archivo: UploadFile = File(...),
    documento_id: str = Form(...),
    canal_origen: str = Form(default="manual"),
):

    archivo_bytes = await archivo.read()
    nombre_archivo = archivo.filename


    solicitud = SolicitudTriaje(
        documento_id=documento_id,
        canal_origen=canal_origen,
        tipo_archivo=archivo.filename.split(".")[-1].lower() if archivo.filename else "archivo",
    )

    respuesta = await procesar_solicitud_triaje(
        solicitud=solicitud,
        archivo_bytes=archivo_bytes,
        nombre_archivo=nombre_archivo,
        es_texto=False
        )

    return respuesta
